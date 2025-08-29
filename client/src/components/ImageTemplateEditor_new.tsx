import React, { useState, useRef, useEffect } from 'react';
import { Template, TemplateElement, TextElement, LogoElement, ShapeElement } from '../types/templates';
import { Palette, Type, Upload, Square, Download, Undo, Redo, Loader, ArrowUp, ArrowDown, ChevronUp, ChevronDown, Trash, Lock, Unlock, Circle, Plus, Bold, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { uploadMedia, getCurrentUser } from '../lib/database';
import '../styles/drag-prevention.css';
import '../styles/template-editor.css';

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
  const [lockedElements, setLockedElements] = useState<Set<string>>(new Set());
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoImages, setLogoImages] = useState<{[key: string]: HTMLImageElement}>({});  
  const [imageDimensions, setImageDimensions] = useState<{width: number, height: number} | null>(null);
  const [canvasDimensions, setCanvasDimensions] = useState<{width: number, height: number}>({width: 800, height: 800});
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [maxZoom, setMaxZoom] = useState<number>(1);

  // Utility function to convert hex color to rgba with opacity
  const hexToRgba = (hex: string, opacity: number = 1): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Calculate zoom level to fit canvas in container
  const calculateZoomLevel = (imageWidth: number, imageHeight: number) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight * 0.35; // Canvas is 35% of viewport height
    
    // Available space for canvas
    const maxWidth = viewportWidth * 0.9;
    const maxHeight = viewportHeight * 0.8;
    
    // Calculate zoom to fit image in available space
    const zoomX = maxWidth / imageWidth;
    const zoomY = maxHeight / imageHeight;
    const fitZoom = Math.min(zoomX, zoomY);
    
    // Set reasonable zoom limits
    const minZoom = Math.min(fitZoom, 0.1);
    const maxZoomLevel = Math.max(fitZoom * 3, 2);
    
    return {
      zoom: Math.max(minZoom, Math.min(fitZoom, 1)), // Start at fit zoom or 100% if smaller
      maxZoom: maxZoomLevel
    };
  };

  useEffect(() => {
    if (canvasRef.current) {
      const canvasElement = canvasRef.current;
      const context = canvasElement.getContext('2d');
      
      if (context) {
        setCanvas(canvasElement);
        setCtx(context);
        
        if (imageUrl) {
          const img = new Image();
          if (!imageUrl.startsWith('blob:') && !imageUrl.startsWith('data:')) {
            img.crossOrigin = 'anonymous';
          }
          
          img.onload = () => {
            setImageDimensions({ width: img.width, height: img.height });
            setCanvasDimensions({ width: img.width, height: img.height });
            canvasElement.width = img.width;
            canvasElement.height = img.height;
            
            const { zoom, maxZoom: maxZoomLevel } = calculateZoomLevel(img.width, img.height);
            setZoomLevel(zoom);
            setMaxZoom(maxZoomLevel);
            
            setBackgroundImage(img);
            redrawCanvas(context, img, elements);
          };
          
          img.onerror = (error) => {
            const dimensions = selectedTemplate?.dimensions || { width: 1080, height: 1080 };
            setImageDimensions(dimensions);
            setCanvasDimensions(dimensions);
            canvasElement.width = dimensions.width;
            canvasElement.height = dimensions.height;
            
            const { zoom, maxZoom: maxZoomLevel } = calculateZoomLevel(dimensions.width, dimensions.height);
            setZoomLevel(zoom);
            setMaxZoom(maxZoomLevel);
            
            context.fillStyle = '#f3f4f6';
            context.fillRect(0, 0, canvasElement.width, canvasElement.height);
          };
          
          img.src = imageUrl;
        } else {
          const dimensions = selectedTemplate?.dimensions || { width: 1080, height: 1080 };
          setImageDimensions(dimensions);
          setCanvasDimensions(dimensions);
          canvasElement.width = dimensions.width;
          canvasElement.height = dimensions.height;
          
          const { zoom, maxZoom: maxZoomLevel } = calculateZoomLevel(dimensions.width, dimensions.height);
          setZoomLevel(zoom);
          setMaxZoom(maxZoomLevel);
          
          context.fillStyle = '#f3f4f6';
          context.fillRect(0, 0, canvasElement.width, canvasElement.height);
        }
      }
    }
  }, [imageUrl, selectedTemplate]);

  useEffect(() => {
    if (ctx && !isLoading) {
      if (backgroundImage) {
        redrawCanvas(ctx, backgroundImage, elements);
      } else {
        redrawCanvasWithoutBackground(ctx, elements);
      }
    }
  }, [elements, ctx, backgroundImage, isLoading]);

  // Prevent body scrolling on mobile when editor is open
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyPosition = document.body.style.position;
    const originalBodyHeight = document.body.style.height;
    const originalBodyWidth = document.body.style.width;
    const originalDocumentElementOverflow = document.documentElement.style.overflow;
    
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.height = '100%';
    document.body.style.width = '100%';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.position = originalBodyPosition;
      document.body.style.height = originalBodyHeight;
      document.body.style.width = originalBodyWidth;
      document.documentElement.style.overflow = originalDocumentElementOverflow;
    };
  }, []);

  const redrawCanvas = (context: CanvasRenderingContext2D, bgImage: HTMLImageElement, currentElements: TemplateElement[]) => {
    if (!canvas) return;
    
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    
    const sortedElements = [...currentElements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    sortedElements.forEach(element => {
      drawElement(context, element);
    });
  };

  const redrawCanvasWithoutBackground = (context: CanvasRenderingContext2D, currentElements: TemplateElement[]) => {
    if (!canvas) return;
    
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#f3f4f6';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    const sortedElements = [...currentElements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    sortedElements.forEach(element => {
      drawElement(context, element);
    });
  };

  const drawElement = (context: CanvasRenderingContext2D, element: TemplateElement) => {
    context.save();
    
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
    
    if (selectedElement === element.id) {
      context.save();
      
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
    
    if (element.backgroundColor) {
      const backgroundOpacity = element.backgroundOpacity || 1;
      context.fillStyle = hexToRgba(element.backgroundColor, backgroundOpacity);
      const padding = element.padding || 0;
      context.fillRect(
        element.x - element.width/2 - padding,
        element.y - element.height/2 - padding,
        element.width + padding * 2,
        element.height + padding * 2
      );
    }
    
    const textOpacity = element.textOpacity || 1;
    context.fillStyle = hexToRgba(element.color || '#000000', textOpacity);
    
    const lines = element.content.split('\n');
    const lineHeight = (element.fontSize || 16) * 1.2;
    const startY = element.y - ((lines.length - 1) * lineHeight) / 2;
    
    lines.forEach((line, index) => {
      context.fillText(line, element.x, startY + index * lineHeight);
    });
  };

  const drawLogoElement = (context: CanvasRenderingContext2D, element: LogoElement) => {
    context.save();
    context.globalAlpha = element.opacity || 1;
    
    if (!element.src) {
      context.fillStyle = 'rgba(209, 213, 219, 0.3)';
      context.fillRect(element.x - element.width/2, element.y - element.height/2, element.width, element.height);
      
      context.strokeStyle = '#9ca3af';
      context.lineWidth = 2;
      context.setLineDash([8, 4]);
      context.strokeRect(element.x - element.width/2, element.y - element.height/2, element.width, element.height);
      context.setLineDash([]);
      
      context.fillStyle = '#6b7280';
      context.font = 'bold 16px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText('Logo', element.x, element.y);
    } else {
      const logoImg = logoImages[element.src];
      if (logoImg) {
        context.drawImage(logoImg, element.x - element.width/2, element.y - element.height/2, element.width, element.height);
      } else {
        if (!logoImages[`loading-${element.src}`]) {
          setLogoImages(prev => ({
            ...prev,
            [`loading-${element.src}`]: new Image()
          }));
          
          const img = new Image();
          img.onload = () => {
            setLogoImages(prev => {
              const newLogoImages = { ...prev };
              delete newLogoImages[`loading-${element.src}`];
              newLogoImages[element.src!] = img;
              return newLogoImages;
            });
          };
          
          if (!element.src.startsWith('blob:') && !element.src.startsWith('data:')) {
            img.crossOrigin = 'anonymous';
          }
          
          img.src = element.src;
        }
        
        context.fillStyle = 'rgba(59, 130, 246, 0.1)';
        context.fillRect(element.x - element.width/2, element.y - element.height/2, element.width, element.height);
        context.strokeStyle = '#3b82f6';
        context.lineWidth = 2;
        context.setLineDash([4, 4]);
        context.strokeRect(element.x - element.width/2, element.y - element.height/2, element.width, element.height);
        context.setLineDash([]);
        
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
        context.fillRect(element.x - element.width/2, element.y - element.height/2, element.width, element.height);
        break;
      case 'circle':
        context.beginPath();
        context.arc(element.x, element.y, Math.min(element.width, element.height) / 2, 0, Math.PI * 2);
        context.fill();
        break;
    }
    
    context.globalAlpha = 1;
  };

  // Event handling
  const getEventCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
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
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const x = (clientX - rect.left) / zoomLevel;
    const y = (clientY - rect.top) / zoomLevel;
    
    return { x, y };
  };

  const handleElementSelection = (x: number, y: number) => {
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

  // Locking functionality
  const isElementLocked = (elementId: string | null): boolean => {
    return elementId ? lockedElements.has(elementId) : false;
  };
  
  const toggleElementLock = () => {
    if (!selectedElement) return;
    
    setLockedElements(prev => {
      const newSet = new Set(prev);
      if (newSet.has(selectedElement)) {
        newSet.delete(selectedElement);
      } else {
        newSet.add(selectedElement);
      }
      return newSet;
    });
  };

  // Mouse event handlers
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const isLocked = isElementLocked(selectedElement);
    if (isLocked) return;
    const { x, y } = getEventCoordinates(e);
    handleElementSelection(x, y);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const isLocked = isElementLocked(selectedElement);
    if (isLocked || !selectedElement) return;
    
    e.preventDefault();
    setIsDragging(true);
    document.body.classList.add('drag-no-scroll');
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const isLocked = isElementLocked(selectedElement);
    if (isLocked) return;
    
    if (isDragging) {
      e.preventDefault();
    }
    const { x, y } = getEventCoordinates(e);
    handleElementDrag(x, y);
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    document.body.classList.remove('drag-no-scroll');
  };

  // Touch event handlers
  const handleCanvasTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const isLocked = isElementLocked(selectedElement);
    if (isLocked) return;
    
    const { x, y } = getEventCoordinates(e);
    
    if (handleElementSelection(x, y)) {
      const newIsLocked = isElementLocked(selectedElement);
      if (!newIsLocked) {
        setIsDragging(true);
        document.body.classList.add('drag-no-scroll');
      }
    }
  };

  const handleCanvasTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const isLocked = isElementLocked(selectedElement);
    if (isLocked) return;
    
    const { x, y } = getEventCoordinates(e);
    handleElementDrag(x, y);
  };

  const handleCanvasTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDragging(false);
    document.body.classList.remove('drag-no-scroll');
  };

  const updateSelectedElement = (updates: Partial<TemplateElement>) => {
    if (!selectedElement) return;
    
    setElements(prev => prev.map(element => {
      if (element.id === selectedElement) {
        return { ...element, ...updates };
      }
      return element;
    }));
  };

  // Layer management
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

  const deleteSelectedElement = () => {
    if (!selectedElement) return;
    setElements(prev => prev.filter(el => el.id !== selectedElement));
    setSelectedElement(null);
  };

  // Element creation
  const createNewTextElement = () => {
    if (!canvas) return;
    
    const fontSize = Math.max(16, Math.min(32, canvas.width / 30));
    const width = Math.min(200, canvas.width * 0.4);
    
    const newElement: TextElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      x: canvas.width / 2,
      y: canvas.height / 2,
      width: width,
      height: fontSize * 1.5,
      content: 'New Text',
      fontSize: fontSize,
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
    
    const size = Math.min(100, canvas.width * 0.15);
    
    const newElement: ShapeElement = {
      id: `shape-${Date.now()}`,
      type: 'shape',
      x: canvas.width / 2,
      y: canvas.height / 2,
      width: size,
      height: shape === 'circle' ? size : size * 0.6,
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
    
    const size = Math.min(80, canvas.width * 0.1);
    
    const newElement: LogoElement = {
      id: `logo-${Date.now()}`,
      type: 'logo',
      x: canvas.width / 2,
      y: canvas.height / 2,
      width: size,
      height: size,
      src: '',
      opacity: 1,
      borderRadius: 0,
      zIndex: Math.max(...elements.map(el => el.zIndex || 0)) + 1
    };
    
    setElements(prev => [...prev, newElement]);
    setSelectedElement(newElement.id);
  };

  // Logo upload
  const handleLogoUpload = async (file: File) => {
    if (!selectedElement) return;
    const element = elements.find(el => el.id === selectedElement);
    if (!element || element.type !== 'logo') return;

    setLogoUploading(true);
    try {
      const user = await getCurrentUser();
      if (user?.user?.id) {
        const logoUrl = await uploadMedia(file, user.user.id);
        updateSelectedElement({ src: logoUrl });
      } else {
        const localUrl = URL.createObjectURL(file);
        updateSelectedElement({ src: localUrl });
      }
    } catch (error) {
      const localUrl = URL.createObjectURL(file);
      updateSelectedElement({ src: localUrl });
    } finally {
      setLogoUploading(false);
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
    const currentSelection = selectedElement;
    
    try {
      setSelectedElement(null);
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/png');
      });
      
      if (!blob) {
        throw new Error('Failed to create image blob');
      }
      
      const localUrl = URL.createObjectURL(blob);
      
      const user = await getCurrentUser();
      if (user?.user?.id) {
        try {
          const file = new File([blob], `template-${Date.now()}.png`, {
            type: 'image/png',
            lastModified: Date.now()
          });
          
          const uploadedUrl = await uploadMedia(file, user.user.id);
          onSave(uploadedUrl);
        } catch (uploadError) {
          onSave(localUrl);
        }
      } else {
        onSave(localUrl);
      }
    } catch (error) {
      console.error('Error exporting template image:', error);
    } finally {
      setIsSaving(false);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex flex-col h-screen overflow-hidden">
      {/* Canvas Area - 35% height */}
      <div className="bg-gray-50 flex flex-col" style={{ height: '35vh' }}>
        {/* Canvas Controls */}
        <div className="flex-shrink-0 p-3 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-600 font-mono">
              {imageDimensions && (
                <span>{imageDimensions.width} × {imageDimensions.height} | {Math.round(zoomLevel * 100)}%</span>
              )}
            </div>
            
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setZoomLevel(Math.max(0.1, zoomLevel - 0.1))}
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors"
                disabled={zoomLevel <= 0.1}
              >
                −
              </button>
              <span className="text-xs text-gray-600 min-w-12 text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel(Math.min(maxZoom, zoomLevel + 0.1))}
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors"
                disabled={zoomLevel >= maxZoom}
              >
                +
              </button>
              <button
                onClick={() => {
                  if (imageDimensions) {
                    const { zoom } = calculateZoomLevel(imageDimensions.width, imageDimensions.height);
                    setZoomLevel(zoom);
                  }
                }}
                className="px-1.5 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors ml-1"
              >
                Fit
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden bg-gray-100 flex items-center justify-center p-2">
          <div 
            className="flex items-center justify-center"
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'center center'
            }}
          >
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
              className="border-2 border-gray-300 rounded-lg shadow-2xl cursor-pointer bg-white transition-all duration-200"
              style={{ 
                width: `${canvasDimensions.width}px`,
                height: `${canvasDimensions.height}px`
              }}
            />
          </div>
        </div>
      </div>

      {/* Tools Panel - 70% height */}
      <div className="bg-white flex flex-col" style={{ height: '70vh' }}>
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Template Editor</h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none p-1 hover:bg-gray-100 rounded transition-colors"
            >
              ×
            </button>
          </div>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {/* Element Creation Toolbar */}
            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Add Elements</h4>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={createNewTextElement}
                  className="p-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 flex flex-col items-center justify-center space-y-1 transition-colors min-h-14"
                  title="Add Text"
                >
                  <Type className="w-4 h-4" />
                  <span className="text-xs font-medium">Text</span>
                </button>
                <button
                  onClick={createNewLogoElement}
                  className="p-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 flex flex-col items-center justify-center space-y-1 transition-colors min-h-14"
                  title="Add Logo"
                >
                  <Upload className="w-4 h-4" />
                  <span className="text-xs font-medium">Logo</span>
                </button>
                <button
                  onClick={() => createNewShapeElement('rectangle')}
                  className="p-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 flex flex-col items-center justify-center space-y-1 transition-colors min-h-14"
                  title="Add Rectangle"
                >
                  <Square className="w-4 h-4" />
                  <span className="text-xs font-medium">Rect</span>
                </button>
                <button
                  onClick={() => createNewShapeElement('circle')}
                  className="p-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 flex flex-col items-center justify-center space-y-1 transition-colors min-h-14"
                  title="Add Circle"
                >
                  <Circle className="w-4 h-4" />
                  <span className="text-xs font-medium">Circle</span>
                </button>
              </div>
            </div>

            {/* Selected Element Properties */}
            {selectedElementData && (
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-gray-900">
                    {selectedElementData.type.charAt(0).toUpperCase() + selectedElementData.type.slice(1)} Element
                  </h4>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={toggleElementLock}
                      className={`p-2 rounded-lg ${isElementLocked(selectedElement) ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'} hover:bg-opacity-80 transition-colors`}
                      title={isElementLocked(selectedElement) ? 'Unlock Element' : 'Lock Element'}
                    >
                      {isElementLocked(selectedElement) ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={deleteSelectedElement}
                      className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                      title="Delete"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Layer Controls */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Layer Order</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      onClick={bringToFront}
                      className="p-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 flex items-center justify-center transition-colors text-xs"
                      title="Bring to Front"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={moveUp}
                      className="p-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 flex items-center justify-center transition-colors text-xs"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={moveDown}
                      className="p-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 flex items-center justify-center transition-colors text-xs"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={sendToBack}
                      className="p-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 flex items-center justify-center transition-colors text-xs"
                      title="Send to Back"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                
                {/* W H X Y Controls in one row */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">W</label>
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
                    <label className="block text-xs font-medium text-gray-700 mb-1">H</label>
                    <input
                      type="number"
                      value={selectedElementData.height || 100}
                      onChange={(e) => updateSelectedElement({ height: parseInt(e.target.value) })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      min="10"
                      max="600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">X</label>
                    <input
                      type="number"
                      value={Math.round(selectedElementData.x || 0)}
                      onChange={(e) => updateSelectedElement({ x: parseInt(e.target.value) })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Y</label>
                    <input
                      type="number"
                      value={Math.round(selectedElementData.y || 0)}
                      onChange={(e) => updateSelectedElement({ y: parseInt(e.target.value) })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                    />
                  </div>
                </div>

                {/* Rotation Control */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rotation</label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={selectedElementData.rotation || 0}
                    onChange={(e) => updateSelectedElement({ rotation: parseInt(e.target.value) })}
                    className="w-full template-range"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>0°</span>
                    <span className="font-medium">{selectedElementData.rotation || 0}°</span>
                    <span>360°</span>
                  </div>
                </div>

                {/* Logo Element Controls */}
                {selectedElementData.type === 'logo' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Logo Upload</label>
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
                        className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg text-sm flex items-center justify-center space-x-2 hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {logoUploading ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span>Upload Logo</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Opacity</label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={(selectedElementData as LogoElement).opacity || 1}
                          onChange={(e) => updateSelectedElement({ opacity: parseFloat(e.target.value) })}
                          className="w-full template-range"
                        />
                        <span className="text-sm text-gray-600 text-center block mt-1">
                          {Math.round(((selectedElementData as LogoElement).opacity || 1) * 100)}%
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Border Radius</label>
                        <input
                          type="number"
                          value={(selectedElementData as LogoElement).borderRadius || 0}
                          onChange={(e) => updateSelectedElement({ borderRadius: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          min="0"
                          max="50"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Text Element Controls */}
                {selectedElementData.type === 'text' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Text Content</label>
                      <textarea
                        value={(selectedElementData as TextElement).content || ''}
                        onChange={(e) => updateSelectedElement({ content: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Font Family</label>
                      <select
                        value={(selectedElementData as TextElement).fontFamily || 'Arial'}
                        onChange={(e) => updateSelectedElement({ fontFamily: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="Arial">Arial</option>
                        <option value="Helvetica">Helvetica</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Roboto">Roboto</option>
                        <option value="Open Sans">Open Sans</option>
                        <option value="Lato">Lato</option>
                        <option value="Montserrat">Montserrat</option>
                        <option value="Poppins">Poppins</option>
                        <option value="Inter">Inter</option>
                      </select>
                    </div>
                    
                    {/* Font Size and Weight with B icon */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Font Size</label>
                        <input
                          type="number"
                          value={(selectedElementData as TextElement).fontSize || 16}
                          onChange={(e) => updateSelectedElement({ fontSize: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          min="8"
                          max="72"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bold</label>
                        <button
                          onClick={() => updateSelectedElement({ 
                            fontWeight: (selectedElementData as TextElement).fontWeight === 'bold' ? 'normal' : 'bold' 
                          })}
                          className={`w-full h-10 border border-gray-300 rounded-lg flex items-center justify-center transition-colors ${
                            (selectedElementData as TextElement).fontWeight === 'bold' 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <Bold className="w-4 h-4" />
                        </button>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                        <input
                          type="color"
                          value={(selectedElementData as TextElement).color || '#000000'}
                          onChange={(e) => updateSelectedElement({ color: e.target.value })}
                          className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Text Alignment with icon buttons */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Alignment</label>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => updateSelectedElement({ textAlign: 'left' })}
                          className={`px-3 py-2 border border-gray-300 rounded-lg flex items-center justify-center transition-colors ${
                            (selectedElementData as TextElement).textAlign === 'left' 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <AlignLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateSelectedElement({ textAlign: 'center' })}
                          className={`px-3 py-2 border border-gray-300 rounded-lg flex items-center justify-center transition-colors ${
                            (selectedElementData as TextElement).textAlign === 'center' 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <AlignCenter className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateSelectedElement({ textAlign: 'right' })}
                          className={`px-3 py-2 border border-gray-300 rounded-lg flex items-center justify-center transition-colors ${
                            (selectedElementData as TextElement).textAlign === 'right' 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <AlignRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Background Controls */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
                        <input
                          type="color"
                          value={(selectedElementData as TextElement).backgroundColor || '#ffffff'}
                          onChange={(e) => updateSelectedElement({ backgroundColor: e.target.value })}
                          className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Background Opacity</label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={(selectedElementData as TextElement).backgroundOpacity || 1}
                          onChange={(e) => updateSelectedElement({ backgroundOpacity: parseFloat(e.target.value) })}
                          className="w-full template-range"
                        />
                        <span className="text-sm text-gray-600 text-center block mt-1">
                          {Math.round(((selectedElementData as TextElement).backgroundOpacity || 1) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Shape Element Controls */}
                {selectedElementData.type === 'shape' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Shape Type</label>
                        <select
                          value={(selectedElementData as ShapeElement).shape || 'rectangle'}
                          onChange={(e) => updateSelectedElement({ shape: e.target.value as 'rectangle' | 'circle' })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="rectangle">Rectangle</option>
                          <option value="circle">Circle</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                        <input
                          type="color"
                          value={(selectedElementData as ShapeElement).color || '#3b82f6'}
                          onChange={(e) => updateSelectedElement({ color: e.target.value })}
                          className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Opacity</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={(selectedElementData as ShapeElement).opacity || 1}
                        onChange={(e) => updateSelectedElement({ opacity: parseFloat(e.target.value) })}
                        className="w-full template-range"
                      />
                      <div className="flex justify-between text-sm text-gray-500 mt-1">
                        <span>0%</span>
                        <span className="font-medium">{Math.round(((selectedElementData as ShapeElement).opacity || 1) * 100)}%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!selectedElementData && (
              <div className="text-center py-12 text-gray-500">
                <div className="bg-gray-50 rounded-lg p-6">
                  <Palette className="w-8 h-8 mx-auto mb-3 text-gray-400" />
                  <p className="text-sm font-medium mb-1">No Element Selected</p>
                  <p className="text-xs text-gray-400">Click on a template element to edit its properties</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Actions - Fixed at bottom */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white">
          <div className="space-y-2.5">
            <button
              onClick={exportImage}
              disabled={isSaving}
              className="w-full bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 font-medium text-sm"
            >
              {isSaving ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Saving Template...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Save & Apply Template</span>
                </>
              )}
            </button>
            
            <button
              onClick={onCancel}
              className="w-full bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
