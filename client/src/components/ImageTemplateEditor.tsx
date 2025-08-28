import React, { useState, useRef, useEffect } from 'react';
import { Template, TemplateElement, TextElement, LogoElement, ShapeElement } from '../types/templates';
import { Palette, Type, Upload, Square, Download, Undo, Redo, Loader, ArrowUp, ArrowDown, ChevronUp, ChevronDown, Trash, Lock, Unlock } from 'lucide-react';
import { uploadMedia, getCurrentUser } from '../lib/database';

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
    
    // Draw selection border if selected
    if (selectedElement === element.id) {
      context.strokeStyle = '#3b82f6';
      context.lineWidth = 2;
      context.setLineDash([5, 5]);
      context.strokeRect(element.x - element.width/2, element.y - element.height/2, element.width, element.height);
      context.setLineDash([]);
    }
    
    context.restore();
  };

  const drawTextElement = (context: CanvasRenderingContext2D, element: TextElement) => {
    if (!element.content) return;
    
    context.font = `${element.fontWeight || 'normal'} ${element.fontSize || 16}px ${element.fontFamily || 'Arial'}`;
    context.fillStyle = element.color || '#000000';
    context.textAlign = (element.textAlign as CanvasTextAlign) || 'left';
    context.textBaseline = 'middle';
    
    // Draw background if specified
    if (element.backgroundColor) {
      context.fillStyle = element.backgroundColor;
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
      context.fillStyle = element.color || '#000000';
    }
    
    // Draw text
    const lines = element.content.split('\n');
    const lineHeight = (element.fontSize || 16) * 1.2;
    const startY = element.y - ((lines.length - 1) * lineHeight) / 2;
    
    lines.forEach((line, index) => {
      context.fillText(line, element.x, startY + index * lineHeight);
    });
  };

  const drawLogoElement = (context: CanvasRenderingContext2D, element: LogoElement) => {
    if (!element.src) {
      // Draw placeholder
      context.strokeStyle = '#d1d5db';
      context.lineWidth = 2;
      context.setLineDash([10, 10]);
      
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
      
      // Draw "Logo" text
      context.fillStyle = '#9ca3af';
      context.font = '14px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText('Logo', element.x, element.y);
    }
  };

  const drawShapeElement = (context: CanvasRenderingContext2D, element: ShapeElement) => {
    context.fillStyle = element.color || '#000000';
    context.globalAlpha = element.opacity || 1;
    
    switch (element.shape) {
      case 'rectangle':
        context.fillRect(
          element.x - element.width/2,
          element.y - element.height/2,
          element.width,
          element.height
        );
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
    if (isLocked) return; // Don't allow selection when locked
    const { x, y } = getEventCoordinates(e);
    handleElementSelection(x, y);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isLocked || !selectedElement) return; // Don't allow dragging when locked
    setIsDragging(true);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isLocked) return; // Don't allow dragging when locked
    const { x, y } = getEventCoordinates(e);
    handleElementDrag(x, y);
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  // Touch event handlers
  const handleCanvasTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (isLocked) return; // Don't allow interaction when locked
    
    const { x, y } = getEventCoordinates(e);
    
    if (handleElementSelection(x, y)) {
      setIsDragging(true);
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

  // Logo upload function
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
        // Fallback to local URL
        const localUrl = URL.createObjectURL(file);
        updateSelectedElement({ src: localUrl });
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      // Fallback to local URL
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
    
    try {
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
        <div className="w-full lg:w-64 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 p-3 overflow-y-auto">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-medium text-gray-900">Template Editor</h3>
              <button
                onClick={onCancel}
                className="text-gray-400 hover:text-gray-600 text-sm font-medium"
              >
                ×
              </button>
            </div>

            {/* Selected Element Properties */}
            {selectedElementData && (
              <div className="border border-gray-200 rounded p-2">
                <h4 className="text-xs font-medium text-gray-900 mb-2">
                  {selectedElementData.type.charAt(0).toUpperCase() + selectedElementData.type.slice(1)}
                </h4>
                
                {/* Element Controls */}
                <div className="flex items-center justify-between mb-2">
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
                  </div>
                  
                  {/* Layer Controls */}
                  <div className="flex items-center space-x-1">
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
                      <textarea
                        value={(selectedElementData as TextElement).content || ''}
                        onChange={(e) => updateSelectedElement({ content: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                        rows={2}
                        placeholder="Text content"
                      />
                    </div>
                    
                    {/* Ultra-compact control grid */}
                    <div className="grid grid-cols-4 gap-1 items-center">
                      {/* Size Control */}
                      <input
                        type="number"
                        value={(selectedElementData as TextElement).fontSize || 16}
                        onChange={(e) => updateSelectedElement({ fontSize: parseInt(e.target.value) })}
                        className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs"
                        title="Font Size"
                      />
                      
                      {/* Weight Control */}
                      <select
                        value={(selectedElementData as TextElement).fontWeight || 'normal'}
                        onChange={(e) => updateSelectedElement({ fontWeight: e.target.value })}
                        className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs"
                        title="Font Weight"
                      >
                        <option value="normal">N</option>
                        <option value="bold">B</option>
                        <option value="600">S</option>
                        <option value="300">L</option>
                      </select>
                      
                      {/* Text Color */}
                      <input
                        type="color"
                        value={(selectedElementData as TextElement).color || '#000000'}
                        onChange={(e) => updateSelectedElement({ color: e.target.value })}
                        className="w-6 h-6 border border-gray-300 rounded cursor-pointer"
                        title="Text Color"
                      />
                      
                      {/* Background Color */}
                      <input
                        type="color"
                        value={(selectedElementData as TextElement).backgroundColor || '#ffffff'}
                        onChange={(e) => updateSelectedElement({ backgroundColor: e.target.value })}
                        className="w-6 h-6 border border-gray-300 rounded cursor-pointer"
                        title="Background Color"
                      />
                      
                      {/* Align Controls - 3 buttons spanning next row */}
                      {['left', 'center', 'right'].map((align) => (
                        <button
                          key={align}
                          onClick={() => updateSelectedElement({ textAlign: align })}
                          className={`px-1 py-0.5 text-xs rounded ${
                            (selectedElementData as TextElement).textAlign === align
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          title={`Align ${align}`}
                        >
                          {align[0].toUpperCase()}
                        </button>
                      ))}
                      
                      {/* Empty cell to fill the grid */}
                      <div></div>
                    </div>
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
