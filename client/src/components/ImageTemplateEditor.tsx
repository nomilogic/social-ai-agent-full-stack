import React, { useState, useRef, useEffect } from 'react';
import { Template, TemplateElement, TextElement, LogoElement, ShapeElement } from '../types/templates';
import { Palette, Type, Upload, Square, Download, Undo, Redo, Loader, ArrowUp, ArrowDown, ChevronUp, ChevronDown, Trash, Lock, Unlock, Circle, Plus } from 'lucide-react';
import { uploadMedia, getCurrentUser } from '../lib/database';
import '../styles/drag-prevention.css';

interface ImageTemplateEditorProps {
  imageUrl: string;
  selectedTemplate?: Template;
  onSave: (imageUrl: string) => void;
  onCancel: () => void;
}

export const ImageTemplateEditor: React.FC<ImageTemplateEditorProps> = ({
  imageUrl,
  selectedTemplate,
  onSave,
  onCancel
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [elements, setElements] = useState<TemplateElement[]>(selectedTemplate?.elements ? [...selectedTemplate.elements] : []);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoImages, setLogoImages] = useState<{[key: string]: HTMLImageElement}>({});
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null); // 'nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'
  const [resizeStart, setResizeStart] = useState<{x: number, y: number, width: number, height: number} | null>(null);

  // Utility function to convert hex color to rgba with opacity
  const hexToRgba = (hex: string, opacity: number = 1): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  useEffect(() => {
    if (canvasRef.current) {
      const canvasElement = canvasRef.current;
      const context = canvasElement.getContext('2d');
      
      if (context) {
        setCanvas(canvasElement);
        setCtx(context);
        
        // Set canvas dimensions
        const dimensions = selectedTemplate?.dimensions || { width: 1080, height: 1080 };
        canvasElement.width = dimensions.width;
        canvasElement.height = dimensions.height;
        
        console.log('Canvas setup complete, image URL:', imageUrl);
        console.log('Selected template:', selectedTemplate);
        console.log('Elements:', elements);
        
        // Initialize canvas with fallback background immediately
        context.fillStyle = '#f3f4f6';
        context.fillRect(0, 0, canvasElement.width, canvasElement.height);
        
        // Draw template elements immediately
        elements.forEach(element => {
          drawElement(context, element);
        });
        
        // Try to load background image asynchronously (non-blocking)
        if (imageUrl) {
          const img = new Image();
          // Only set crossOrigin for external URLs, not for blob URLs or data URLs
          if (!imageUrl.startsWith('blob:') && !imageUrl.startsWith('data:')) {
            img.crossOrigin = 'anonymous';
          }
          
          img.onload = () => {
            console.log('Background image loaded successfully:', imageUrl);
            setBackgroundImage(img);
            redrawCanvas(context, img, elements);
          };
          
          img.onerror = (error) => {
            console.error('Background image failed to load:', imageUrl, error);
            // Keep the fallback background
          };
          
          console.log('Attempting to load background image:', imageUrl);
          img.src = imageUrl;
        }
      }
    }
  }, [imageUrl, selectedTemplate]);

  useEffect(() => {
    if (ctx && !isLoading) {
      if (backgroundImage) {
        redrawCanvas(ctx, backgroundImage, elements);
      } else {
        // Draw without background image
        redrawCanvasWithoutBackground(ctx, elements);
      }
    }
  }, [elements, ctx, backgroundImage, isLoading]);

  const redrawCanvas = (context: CanvasRenderingContext2D, bgImage: HTMLImageElement, currentElements: TemplateElement[]) => {
    if (!canvas) return;
    
    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background image
    context.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    
    // Draw elements sorted by zIndex
    const sortedElements = [...currentElements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    
    sortedElements.forEach(element => {
      drawElement(context, element);
    });
  };

  const redrawCanvasWithoutBackground = (context: CanvasRenderingContext2D, currentElements: TemplateElement[]) => {
    if (!canvas) return;
    
    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw a light gray background as fallback
    context.fillStyle = '#f3f4f6';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw "Image Loading Failed" text
    context.fillStyle = '#6b7280';
    context.font = '24px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('Image Loading Failed', canvas.width / 2, canvas.height / 2 - 50);
    context.font = '16px Arial';
    context.fillText('Template elements still available below', canvas.width / 2, canvas.height / 2 - 20);
    
    // Draw elements sorted by zIndex
    const sortedElements = [...currentElements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    
    sortedElements.forEach(element => {
      drawElement(context, element);
    });
  };

  const drawElement = (context: CanvasRenderingContext2D, element: TemplateElement) => {
    context.save();
    
    // Apply rotation if specified
    if (element.rotation && element.rotation !== 0) {
      context.translate(element.x, element.y);
      context.rotate((element.rotation * Math.PI) / 180);
      context.translate(-element.x, -element.y);
    }
    
    switch (element.type) {
      case 'text':
        drawTextElement(context, element as TextElement);
        break;
      case 'logo':
        drawLogoElement(context, element as LogoElement);
        break;
      case 'shape':
        drawShapeElement(context, element as ShapeElement);
        break;
    }
    
    context.restore();
    
    // Draw selection border if selected (after restore to avoid rotation)
    if (selectedElement === element.id) {
      context.save();
      
      // Apply same rotation for selection border
      if (element.rotation && element.rotation !== 0) {
        context.translate(element.x, element.y);
        context.rotate((element.rotation * Math.PI) / 180);
        context.translate(-element.x, -element.y);
      }
      
      context.strokeStyle = '#3b82f6';
      context.lineWidth = 2;
      context.setLineDash([5, 5]);
      context.strokeRect(element.x - element.width/2, element.y - element.height/2, element.width, element.height);
      context.setLineDash([]);
      
      context.restore();
    }
  };

  const drawTextElement = (context: CanvasRenderingContext2D, element: TextElement) => {
    if (!element.content) return;
    
    context.font = `${element.fontWeight || 'normal'} ${element.fontSize || 16}px ${element.fontFamily || 'Arial'}`;
    context.textAlign = (element.textAlign as CanvasTextAlign) || 'left';
    context.textBaseline = 'middle';
    
    // Draw background if specified
    if (element.backgroundColor) {
      const backgroundOpacity = element.backgroundOpacity || 1;
      context.fillStyle = hexToRgba(element.backgroundColor, backgroundOpacity);
      const padding = element.padding || 0;
      const borderRadius = element.borderRadius || 0;
      
      if (borderRadius > 0) {
        drawRoundedRect(
          context,
          element.x - element.width/2 - padding,
          element.y - element.height/2 - padding,
          element.width + padding * 2,
          element.height + padding * 2,
          borderRadius
        );
      } else {
        context.fillRect(
          element.x - element.width/2 - padding,
          element.y - element.height/2 - padding,
          element.width + padding * 2,
          element.height + padding * 2
        );
      }
    }
    
    // Set text color with opacity
    const textOpacity = element.textOpacity || 1;
    context.fillStyle = hexToRgba(element.color || '#000000', textOpacity);
    
    // Draw text
    const lines = element.content.split('\n');
    const lineHeight = (element.fontSize || 16) * 1.2;
    const startY = element.y - ((lines.length - 1) * lineHeight) / 2;
    
    lines.forEach((line, index) => {
      context.fillText(line, element.x, startY + index * lineHeight);
    });
  };

  const drawLogoElement = (context: CanvasRenderingContext2D, element: LogoElement) => {
    console.log('🇺 Logo Element Debug:', {
      id: element.id,
      src: element.src,
      position: { x: element.x, y: element.y },
      dimensions: { width: element.width, height: element.height },
      opacity: element.opacity,
      hasImageInCache: element.src ? !!logoImages[element.src] : false,
      logoImagesKeys: Object.keys(logoImages)
    });
    
    // Apply element opacity to context
    context.save();
    context.globalAlpha = element.opacity || 1;
    
    if (!element.src) {
      console.log('💷 Drawing placeholder for logo element (no src)');
      // Draw a more visible placeholder background
      context.fillStyle = 'rgba(209, 213, 219, 0.3)'; // Light gray background
      context.fillRect(
        element.x - element.width/2,
        element.y - element.height/2,
        element.width,
        element.height
      );
      
      // Draw placeholder border
      context.strokeStyle = '#9ca3af';
      context.lineWidth = 2;
      context.setLineDash([8, 4]);
      
      if (element.borderRadius && element.borderRadius > 0) {
        drawRoundedRect(
          context,
          element.x - element.width/2,
          element.y - element.height/2,
          element.width,
          element.height,
          element.borderRadius
        );
        context.stroke();
      } else {
        context.strokeRect(
          element.x - element.width/2,
          element.y - element.height/2,
          element.width,
          element.height
        );
      }
      
      context.setLineDash([]);
      
      // Draw "Logo" text more visibly
      context.fillStyle = '#6b7280';
      context.font = 'bold 16px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText('Logo', element.x, element.y);
      
      // Draw upload hint
      context.fillStyle = '#9ca3af';
      context.font = '12px Arial';
      context.fillText('Click to upload', element.x, element.y + 20);
    } else {
      // Draw logo image
      const logoImg = logoImages[element.src];
      if (logoImg) {
        console.log('✅ Drawing actual logo image from cache');
        
        // Create clipping path for border radius if specified
        if (element.borderRadius && element.borderRadius > 0) {
          context.beginPath();
          const x = element.x - element.width/2;
          const y = element.y - element.height/2;
          const radius = element.borderRadius;
          
          context.moveTo(x + radius, y);
          context.lineTo(x + element.width - radius, y);
          context.quadraticCurveTo(x + element.width, y, x + element.width, y + radius);
          context.lineTo(x + element.width, y + element.height - radius);
          context.quadraticCurveTo(x + element.width, y + element.height, x + element.width - radius, y + element.height);
          context.lineTo(x + radius, y + element.height);
          context.quadraticCurveTo(x, y + element.height, x, y + element.height - radius);
          context.lineTo(x, y + radius);
          context.quadraticCurveTo(x, y, x + radius, y);
          context.closePath();
          context.clip();
        }
        
        // Draw the image
        context.drawImage(
          logoImg,
          element.x - element.width/2,
          element.y - element.height/2,
          element.width,
          element.height
        );
      } else {
        console.log('🔄 Logo image not in cache, attempting to load:', element.src);
        
        // Check if we're already trying to load this image
        if (!logoImages[`loading-${element.src}`]) {
          // Mark as loading to prevent multiple load attempts
          setLogoImages(prev => ({
            ...prev,
            [`loading-${element.src}`]: new Image() // Placeholder to mark as loading
          }));
          
          // Image is loading or failed to load, try to load it
          const img = new Image();
          img.onload = () => {
            console.log('✅ Logo image loaded successfully, adding to cache:', element.src);
            setLogoImages(prev => {
              const newLogoImages = { ...prev };
              // Remove loading marker and add actual image
              delete newLogoImages[`loading-${element.src}`];
              newLogoImages[element.src!] = img;
              console.log('📊 Updated logoImages cache:', Object.keys(newLogoImages));
              return newLogoImages;
            });
            
            // Trigger a redraw without interfering with current state
            // Use a timeout to avoid interfering with any ongoing drag operations
            setTimeout(() => {
              console.log('🎨 Triggering canvas redraw after logo load');
              // Force a component re-render which will trigger the useEffect redraw
              // This ensures we use the latest elements state from React
              setLogoImages(prev => ({ ...prev })); // Trigger re-render
            }, 50); // Slightly longer delay to avoid drag interference
          };
          
          img.onerror = (error) => {
            console.error('❌ Failed to load logo image:', element.src, error);
            // Remove loading marker on error
            setLogoImages(prev => {
              const newLogoImages = { ...prev };
              delete newLogoImages[`loading-${element.src}`];
              return newLogoImages;
            });
          };
          
          // Only set crossOrigin for external URLs
          if (!element.src.startsWith('blob:') && !element.src.startsWith('data:')) {
            img.crossOrigin = 'anonymous';
          }
          
          console.log('🔎 Starting to load logo image:', element.src);
          img.src = element.src;
        }
        
        // Draw loading placeholder while image loads
        console.log('📄 Drawing loading placeholder for logo');
        
        // Draw semi-transparent background
        context.fillStyle = 'rgba(59, 130, 246, 0.1)';
        context.fillRect(
          element.x - element.width/2,
          element.y - element.height/2,
          element.width,
          element.height
        );
        
        // Draw loading border
        context.strokeStyle = '#3b82f6';
        context.lineWidth = 2;
        context.setLineDash([4, 4]);
        context.strokeRect(
          element.x - element.width/2,
          element.y - element.height/2,
          element.width,
          element.height
        );
        context.setLineDash([]);
        
        // Draw loading text
        context.fillStyle = '#3b82f6';
        context.font = 'bold 14px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('Loading...', element.x, element.y);
      }
    }
    
    context.restore();
  };

  const drawShapeElement = (context: CanvasRenderingContext2D, element: ShapeElement) => {
    context.fillStyle = element.color || '#000000';
    context.globalAlpha = element.opacity || 1;
    
    switch (element.shape) {
      case 'rectangle':
        if (element.borderRadius && element.borderRadius > 0) {
          drawRoundedRect(
            context,
            element.x - element.width/2,
            element.y - element.height/2,
            element.width,
            element.height,
            element.borderRadius
          );
        } else {
          context.fillRect(
            element.x - element.width/2,
            element.y - element.height/2,
            element.width,
            element.height
          );
        }
        break;
      case 'circle':
        context.beginPath();
        context.arc(element.x, element.y, Math.min(element.width, element.height) / 2, 0, Math.PI * 2);
        context.fill();
        break;
    }
    
    context.globalAlpha = 1;
  };

  const drawRoundedRect = (
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + width - radius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + radius);
    context.lineTo(x + width, y + height - radius);
    context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    context.lineTo(x + radius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - radius);
    context.lineTo(x, y + radius);
    context.quadraticCurveTo(x, y, x + radius, y);
    context.closePath();
    context.fill();
  };

  // Generic function to get coordinates from mouse or touch events
  const getEventCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    if ('touches' in e) {
      // Touch event
      if (e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('changedTouches' in e && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
      } else {
        return { x: 0, y: 0 };
      }
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    
    return { x, y };
  };

  const handleElementSelection = (x: number, y: number) => {
    // Find clicked/touched element
    const clickedElement = elements.find(element => {
      return (
        x >= element.x - element.width/2 &&
        x <= element.x + element.width/2 &&
        y >= element.y - element.height/2 &&
        y <= element.y + element.height/2
      );
    });
    
    if (clickedElement) {
      setSelectedElement(clickedElement.id);
      setDragOffset({
        x: x - clickedElement.x,
        y: y - clickedElement.y
      });
      return true;
    } else {
      setSelectedElement(null);
      return false;
    }
  };

  const handleElementDrag = (x: number, y: number) => {
    if (!isDragging || !selectedElement) return;
    
    setElements(prev => prev.map(element => {
      if (element.id === selectedElement) {
        return {
          ...element,
          x: x - dragOffset.x,
          y: y - dragOffset.y
        };
      }
      return element;
    }));
  };

  // Mouse event handlers
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    console.log('🖱️ Canvas click event', { isLocked, selectedElement, isDragging });
    if (isLocked) return; // Don't allow selection when locked
    const { x, y } = getEventCoordinates(e);
    const selected = handleElementSelection(x, y);
    console.log('👆 Element selection result:', selected);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    console.log('⬇️ Mouse down event', { isLocked, selectedElement, isDragging });
    if (isLocked || !selectedElement) {
      console.log('❌ Mouse down blocked:', { isLocked, selectedElement });
      return; // Don't allow dragging when locked
    }
    e.preventDefault(); // Prevent scrolling during drag
    setIsDragging(true);
    console.log('✅ Starting drag for element:', selectedElement);
    
    // Apply CSS class to prevent scrolling smoothly
    document.body.classList.add('drag-no-scroll');
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isLocked) return; // Don't allow dragging when locked
    if (isDragging) {
      console.log('🔄 Dragging element:', selectedElement, { x: getEventCoordinates(e).x, y: getEventCoordinates(e).y });
      e.preventDefault(); // Prevent scrolling while dragging
    }
    const { x, y } = getEventCoordinates(e);
    handleElementDrag(x, y);
  };

  const handleCanvasMouseUp = () => {
    console.log('⬆️ Mouse up event, ending drag for:', selectedElement);
    setIsDragging(false);
    
    // Remove CSS class to restore normal scrolling smoothly
    document.body.classList.remove('drag-no-scroll');
  };

  // Touch event handlers
  const handleCanvasTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (isLocked) return; // Don't allow interaction when locked
    
    const { x, y } = getEventCoordinates(e);
    
    if (handleElementSelection(x, y)) {
      setIsDragging(true);
      
      // Apply CSS class to prevent scrolling smoothly
      document.body.classList.add('drag-no-scroll');
    }
  };

  const handleCanvasTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (isLocked) return; // Don't allow dragging when locked
    
    const { x, y } = getEventCoordinates(e);
    handleElementDrag(x, y);
  };

  const handleCanvasTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    // Remove CSS class to restore normal scrolling smoothly
    document.body.classList.remove('drag-no-scroll');
  };

  const updateSelectedElement = (updates: Partial<TemplateElement>) => {
    if (!selectedElement) {
      console.log('❌ No selected element to update');
      return;
    }
    
    console.log('🔄 Updating element:', selectedElement, 'Updates:', updates);
    
    setElements(prev => prev.map(element => {
      if (element.id === selectedElement) {
        const updatedElement = { ...element, ...updates };
        console.log('✅ Element updated:', updatedElement);
        return updatedElement;
      }
      return element;
    }));
  };

  // Layer management functions
  const bringToFront = () => {
    if (!selectedElement) return;
    const maxZ = Math.max(...elements.map(el => el.zIndex || 0));
    updateSelectedElement({ zIndex: maxZ + 1 });
  };

  const sendToBack = () => {
    if (!selectedElement) return;
    const minZ = Math.min(...elements.map(el => el.zIndex || 0));
    updateSelectedElement({ zIndex: minZ - 1 });
  };

  const moveUp = () => {
    if (!selectedElement) return;
    const currentEl = elements.find(el => el.id === selectedElement);
    if (!currentEl) return;
    const currentZ = currentEl.zIndex || 0;
    const nextZ = elements.filter(el => (el.zIndex || 0) > currentZ).sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))[0]?.zIndex;
    if (nextZ !== undefined) {
      updateSelectedElement({ zIndex: nextZ + 0.1 });
    }
  };

  const moveDown = () => {
    if (!selectedElement) return;
    const currentEl = elements.find(el => el.id === selectedElement);
    if (!currentEl) return;
    const currentZ = currentEl.zIndex || 0;
    const prevZ = elements.filter(el => (el.zIndex || 0) < currentZ).sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0))[0]?.zIndex;
    if (prevZ !== undefined) {
      updateSelectedElement({ zIndex: prevZ - 0.1 });
    }
  };

  // Delete element function
  const deleteSelectedElement = () => {
    if (!selectedElement) return;
    setElements(prev => prev.filter(el => el.id !== selectedElement));
    setSelectedElement(null);
  };

  // Element creation functions
  const createNewTextElement = () => {
    if (!canvas) return;
    
    const newElement: TextElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      x: canvas.width / 2,
      y: canvas.height / 2,
      width: 200,
      height: 40,
      content: 'New Text',
      fontSize: 24,
      fontWeight: 'normal',
      fontFamily: 'Arial',
      color: '#000000',
      textAlign: 'center',
      backgroundColor: '#ffffff',
      backgroundOpacity: 0.8,
      textOpacity: 1,
      padding: 8,
      borderRadius: 4,
      zIndex: Math.max(...elements.map(el => el.zIndex || 0)) + 1
    };
    
    setElements(prev => [...prev, newElement]);
    setSelectedElement(newElement.id);
  };

  const createNewShapeElement = (shape: 'rectangle' | 'circle') => {
    if (!canvas) return;
    
    const newElement: ShapeElement = {
      id: `shape-${Date.now()}`,
      type: 'shape',
      x: canvas.width / 2,
      y: canvas.height / 2,
      width: 100,
      height: shape === 'circle' ? 100 : 60,
      shape,
      color: '#3b82f6',
      opacity: 1,
      zIndex: Math.max(...elements.map(el => el.zIndex || 0)) + 1
    };
    
    setElements(prev => [...prev, newElement]);
    setSelectedElement(newElement.id);
  };

  const createNewLogoElement = () => {
    if (!canvas) return;
    
    const newElement: LogoElement = {
      id: `logo-${Date.now()}`,
      type: 'logo',
      x: canvas.width / 2,
      y: canvas.height / 2,
      width: 80,
      height: 80,
      src: '',
      opacity: 1,
      borderRadius: 0,
      zIndex: Math.max(...elements.map(el => el.zIndex || 0)) + 1
    };
    
    setElements(prev => [...prev, newElement]);
    setSelectedElement(newElement.id);
  };

  // Logo upload function
  const handleLogoUpload = async (file: File) => {
    if (!selectedElement) {
      console.log('❌ No selected element for logo upload');
      return;
    }
    const element = elements.find(el => el.id === selectedElement);
    if (!element || element.type !== 'logo') {
      console.log('❌ Selected element is not a logo element:', element?.type);
      return;
    }

    console.log('🚀 Starting logo upload for element:', selectedElement, 'File:', file.name);
    setLogoUploading(true);
    try {
      const user = await getCurrentUser();
      if (user?.user?.id) {
        console.log('📤 Uploading logo to server...');
        const logoUrl = await uploadMedia(file, user.user.id);
        console.log('✅ Logo uploaded successfully:', logoUrl);
        updateSelectedElement({ src: logoUrl });
      } else {
        // Fallback to local URL
        console.log('🔄 No user found, using local URL fallback');
        const localUrl = URL.createObjectURL(file);
        console.log('📎 Created local URL:', localUrl);
        updateSelectedElement({ src: localUrl });
      }
    } catch (error) {
      console.error('❌ Error uploading logo:', error);
      // Fallback to local URL
      console.log('🔄 Using local URL fallback due to upload error');
      const localUrl = URL.createObjectURL(file);
      console.log('📎 Created fallback local URL:', localUrl);
      updateSelectedElement({ src: localUrl });
    } finally {
      setLogoUploading(false);
      console.log('🏁 Logo upload process completed');
    }
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleLogoUpload(file);
    }
  };

  const exportImage = async () => {
    if (!canvas) return;
    
    setIsSaving(true);
    
    // Store current selection to restore later
    const currentSelection = selectedElement;
    
    try {
      // Temporarily clear selection to avoid border in exported image
      setSelectedElement(null);
      
      // Wait for the canvas to redraw without selection border
      await new Promise(resolve => setTimeout(resolve, 50));
      // First create blob URL for immediate use
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/png');
      });
      
      if (!blob) {
        throw new Error('Failed to create image blob');
      }
      
      // Create local URL for immediate preview
      const localUrl = URL.createObjectURL(blob);
      
      // Upload to server for persistent storage
      const user = await getCurrentUser();
      if (user?.user?.id) {
        try {
          // Convert blob to File for upload
          const file = new File([blob], `template-${Date.now()}.png`, {
            type: 'image/png',
            lastModified: Date.now()
          });
          
          console.log('Uploading template image to server...');
          const uploadedUrl = await uploadMedia(file, user.user.id);
          console.log('Template image uploaded successfully:', uploadedUrl);
          
          // Use the uploaded URL as the final image
          onSave(uploadedUrl);
        } catch (uploadError) {
          console.warn('Failed to upload template image, using local URL:', uploadError);
          // Fallback to local URL if upload fails
          onSave(localUrl);
        }
      } else {
        console.warn('No user found, using local URL');
        // Fallback to local URL if no user
        onSave(localUrl);
      }
    } catch (error) {
      console.error('Error exporting template image:', error);
    } finally {
      setIsSaving(false);
      // Restore the selection after export is complete
      if (currentSelection) {
        setSelectedElement(currentSelection);
      }
    }
  };

  const selectedElementData = elements.find(el => el.id === selectedElement);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center p-2">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full overflow-hidden flex flex-col lg:flex-row">
        {/* Canvas Area */}
        <div className="flex-0 p-3 flex items-center justify-center bg-gray-50">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            onTouchStart={handleCanvasTouchStart}
            onTouchMove={handleCanvasTouchMove}
            onTouchEnd={handleCanvasTouchEnd}
            className="border border-gray-200 rounded cursor-pointer max-w-full max-h-full"
            style={{ 
              maxWidth: '400px', 
              maxHeight: '400px',
              width: 'auto',
              height: 'auto'
            }}
          />
        </div>

        {/* Properties Panel */}
        <div className="w-full bg-white border-t lg:border-t-0 lg:border-l border-gray-200 p-3 overflow-y-auto">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-0">
              <h3 className="text-xs font-medium text-gray-900">Template Editor</h3>
              <button
                onClick={onCancel}
                className="text-gray-400 hover:text-gray-600 text-sm font-medium"
              >
                ×
              </button>
            </div>

            {/* Element Creation Toolbar */}
            <div className="border border-gray-200 rounded p-2">
              <h4 className="text-xs font-medium text-gray-700 mb-2">Add Elements</h4>
              <div className="grid grid-cols-4 gap-1">
                <button
                  onClick={createNewTextElement}
                  className="p-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 flex items-center justify-center"
                  title="Add Text"
                >
                  <Type className="w-4 h-4" />
                </button>
                <button
                  onClick={createNewLogoElement}
                  className="p-2 bg-green-50 text-green-700 rounded hover:bg-green-100 flex items-center justify-center"
                  title="Add Logo"
                >
                  <Upload className="w-4 h-4" />
                </button>
                <button
                  onClick={() => createNewShapeElement('rectangle')}
                  className="p-2 bg-purple-50 text-purple-700 rounded hover:bg-purple-100 flex items-center justify-center"
                  title="Add Rectangle"
                >
                  <Square className="w-4 h-4" />
                </button>
                <button
                  onClick={() => createNewShapeElement('circle')}
                  className="p-2 bg-orange-50 text-orange-700 rounded hover:bg-orange-100 flex items-center justify-center"
                  title="Add Circle"
                >
                  <Circle className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Selected Element Properties */}
            {selectedElementData && (
              <div className="border border-gray-200 rounded p-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-medium text-gray-900">
                    {selectedElementData.type.charAt(0).toUpperCase() + selectedElementData.type.slice(1)}
                  </h4>
                  
                  {/* All Control Buttons */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setIsLocked(!isLocked)}
                      className={`p-1 rounded text-xs ${isLocked ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'} hover:bg-opacity-80`}
                      title={isLocked ? 'Unlock' : 'Lock'}
                    >
                      {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={deleteSelectedElement}
                      className="p-1 rounded bg-red-100 text-red-600 hover:bg-red-200 text-xs"
                      title="Delete"
                    >
                      <Trash className="w-3 h-3" />
                    </button>
                    <button
                      onClick={bringToFront}
                      className="p-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs"
                      title="Front"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={moveUp}
                      className="p-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs"
                      title="Up"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={moveDown}
                      className="p-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs"
                      title="Down"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      onClick={sendToBack}
                      className="p-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs"
                      title="Back"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                {/* Size Controls - Universal for all elements */}
                <div className="grid grid-cols-4 gap-2 mb-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Width</label>
                    <input
                      type="number"
                      value={selectedElementData.width || 100}
                      onChange={(e) => updateSelectedElement({ width: parseInt(e.target.value) })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      min="10"
                      max="800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Height</label>
                    <input
                      type="number"
                      value={selectedElementData.height || 100}
                      onChange={(e) => updateSelectedElement({ height: parseInt(e.target.value) })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      min="10"
                      max="600"
                    />
                  </div>
                </div>

                {/* Rotation Control - Universal */}
                <div className="mb-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Rotation</label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={selectedElementData.rotation || 0}
                    onChange={(e) => updateSelectedElement({ rotation: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0°</span>
                    <span className="font-medium">{selectedElementData.rotation || 0}°</span>
                    <span>360°</span>
                  </div>
                </div>

                {selectedElementData.type === 'logo' && (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Logo</label>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoFileChange}
                        className="hidden"
                      />
                      <button
                        onClick={() => logoInputRef.current?.click()}
                        disabled={logoUploading}
                        className="w-full bg-blue-600 text-white px-2 py-1 rounded text-xs flex items-center justify-center space-x-1 hover:bg-blue-700 disabled:opacity-50"
                      >
                        {logoUploading ? (
                          <>
                            <Loader className="w-3 h-3 animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3 h-3" />
                            <span>Upload</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Opacity</label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={(selectedElementData as LogoElement).opacity || 1}
                          onChange={(e) => updateSelectedElement({ opacity: parseFloat(e.target.value) })}
                          className="w-full h-1"
                        />
                        <span className="text-xs text-gray-600">
                          {Math.round(((selectedElementData as LogoElement).opacity || 1) * 100)}%
                        </span>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Radius</label>
                        <input
                          type="number"
                          value={(selectedElementData as LogoElement).borderRadius || 0}
                          onChange={(e) => updateSelectedElement({ borderRadius: parseInt(e.target.value) })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {selectedElementData.type === 'text' && (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Text Content</label>
                      <textarea
                        value={(selectedElementData as TextElement).content || ''}
                        onChange={(e) => updateSelectedElement({ content: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                        rows={2}
                        placeholder="Enter your text..."
                      />
                    </div>
                    
                    {/* Typography Controls */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Font Size</label>
                        <input
                          type="number"
                          value={(selectedElementData as TextElement).fontSize || 16}
                          onChange={(e) => updateSelectedElement({ fontSize: parseInt(e.target.value) })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          min="8"
                          max="72"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Weight</label>
                        <select
                          value={(selectedElementData as TextElement).fontWeight || 'normal'}
                          onChange={(e) => updateSelectedElement({ fontWeight: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                        >
                          <option value="300">Light</option>
                          <option value="normal">Normal</option>
                          <option value="600">Semi-Bold</option>
                          <option value="bold">Bold</option>
                        </select>
                      </div>
                    </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Alignment</label>
                        <select
                          value={(selectedElementData as TextElement).textAlign || 'left'}
                          onChange={(e) => updateSelectedElement({ textAlign: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                        >
                          <option value="left">Left</option>
                          <option value="center">Center</option>
                          <option value="right">Right</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Text Color</label>
                        <input
                          type="color"
                          value={(selectedElementData as TextElement).color || '#000000'}
                          onChange={(e) => updateSelectedElement({ color: e.target.value })}
                          className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                        />
                    </div>

                    {/* Background Controls */}
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">BG Color</label>
                        <input
                          type="color"
                          value={(selectedElementData as TextElement).backgroundColor || '#ffffff'}
                          onChange={(e) => updateSelectedElement({ backgroundColor: e.target.value })}
                          className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Padding</label>
                        <input
                          type="number"
                          value={(selectedElementData as TextElement).padding || 8}
                          onChange={(e) => updateSelectedElement({ padding: parseInt(e.target.value) })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          min="0"
                          max="50"
                        />
                      </div>
                    </div>
                    
                    {/* Opacity Controls */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Text Opacity</label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={(selectedElementData as TextElement).textOpacity || 1}
                          onChange={(e) => updateSelectedElement({ textOpacity: parseFloat(e.target.value) })}
                          className="w-full"
                        />
                        <span className="text-xs text-gray-600 text-center block">
                          {Math.round(((selectedElementData as TextElement).textOpacity || 1) * 100)}%
                        </span>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">BG Opacity</label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={(selectedElementData as TextElement).backgroundOpacity || 1}
                          onChange={(e) => updateSelectedElement({ backgroundOpacity: parseFloat(e.target.value) })}
                          className="w-full"
                        />
                        <span className="text-xs text-gray-600 text-center block">
                          {Math.round(((selectedElementData as TextElement).backgroundOpacity || 1) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedElementData.type === 'shape' && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Shape</label>
                        <select
                          value={(selectedElementData as ShapeElement).shape || 'rectangle'}
                          onChange={(e) => updateSelectedElement({ shape: e.target.value as 'rectangle' | 'circle' })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                        >
                          <option value="rectangle">Rectangle</option>
                          <option value="circle">Circle</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
                        <input
                          type="color"
                          value={(selectedElementData as ShapeElement).color || '#3b82f6'}
                          onChange={(e) => updateSelectedElement({ color: e.target.value })}
                          className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Opacity</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={(selectedElementData as ShapeElement).opacity || 1}
                        onChange={(e) => updateSelectedElement({ opacity: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>0%</span>
                        <span className="font-medium">{Math.round(((selectedElementData as ShapeElement).opacity || 1) * 100)}%</span>
                        <span>100%</span>
                      </div>
                    </div>
                    
                    {(selectedElementData as ShapeElement).shape === 'rectangle' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Corner Radius</label>
                        <input
                          type="number"
                          value={(selectedElementData as ShapeElement).borderRadius || 0}
                          onChange={(e) => updateSelectedElement({ borderRadius: parseInt(e.target.value) })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          min="0"
                          max="50"
                          placeholder="0"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {!selectedElementData && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">Click on a template element to edit it</p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={exportImage}
                disabled={isSaving}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {isSaving ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Save Template</span>
                  </>
                )}
              </button>
              
              <button
                onClick={onCancel}
                className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
