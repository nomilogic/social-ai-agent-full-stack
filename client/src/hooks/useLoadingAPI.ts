import { useCallback } from 'react';
import { useLoading } from '../context/LoadingContext';

/**
 * Hook for managing API call loading states with preloader overlay
 */
export const useLoadingAPI = () => {
  const { showLoading, hideLoading, updateLoadingMessage, updateLoadingProgress } = useLoading();

  /**
   * Wrapper for API calls with automatic loading management
   * @param apiCall - The async function to execute
   * @param loadingMessage - Message to show during loading
   * @param options - Optional configuration
   */
  const executeWithLoading = useCallback(async <T>(
    apiCall: () => Promise<T>,
    loadingMessage: string,
    options?: {
      progress?: number;
      canCancel?: boolean;
      onCancel?: () => void;
      successMessage?: string;
      errorMessage?: string;
    }
  ): Promise<T | null> => {
    try {
      // Show loading overlay
      showLoading(loadingMessage, {
        progress: options?.progress,
        canCancel: options?.canCancel,
        onCancel: options?.onCancel
      });

      // Execute the API call
      const result = await apiCall();

      // Show success message briefly if provided
      if (options?.successMessage) {
        updateLoadingMessage(options.successMessage);
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      return result;
    } catch (error) {
      console.error('API call failed:', error);
      
      // Show error message briefly if provided
      if (options?.errorMessage) {
        updateLoadingMessage(options.errorMessage);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      throw error; // Re-throw to allow caller to handle
    } finally {
      // Always hide loading overlay
      hideLoading();
    }
  }, [showLoading, hideLoading, updateLoadingMessage]);

  /**
   * Wrapper for image generation API calls with progress updates
   */
  const executeImageGeneration = useCallback(async <T>(
    apiCall: () => Promise<T>,
    baseMessage: string = 'Generating AI image...',
    options?: {
      canCancel?: boolean;
      onCancel?: () => void;
    }
  ): Promise<T | null> => {
    return executeWithLoading(
      async () => {
        // Simulate progress for image generation
        updateLoadingProgress(10);
        updateLoadingMessage(`${baseMessage} - Analyzing your request`);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        updateLoadingProgress(30);
        updateLoadingMessage(`${baseMessage} - Creating visual concepts`);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        updateLoadingProgress(60);
        updateLoadingMessage(`${baseMessage} - Rendering high-quality image`);
        
        const result = await apiCall();
        
        updateLoadingProgress(90);
        updateLoadingMessage(`${baseMessage} - Finalizing image`);
        
        await new Promise(resolve => setTimeout(resolve, 300));
        updateLoadingProgress(100);
        
        return result;
      },
      baseMessage,
      {
        progress: 0,
        canCancel: options?.canCancel,
        onCancel: options?.onCancel,
        successMessage: 'Image generated successfully!'
      }
    );
  }, [executeWithLoading, updateLoadingProgress, updateLoadingMessage]);

  /**
   * Wrapper for post generation API calls with progress updates
   */
  const executePostGeneration = useCallback(async <T>(
    apiCall: () => Promise<T>,
    baseMessage: string = 'Generating social media posts...',
    options?: {
      canCancel?: boolean;
      onCancel?: () => void;
    }
  ): Promise<T | null> => {
    return executeWithLoading(
      async () => {
        // Simulate progress for post generation
        updateLoadingProgress(15);
        updateLoadingMessage(`${baseMessage} - Analyzing content and audience`);
        
        await new Promise(resolve => setTimeout(resolve, 800));
        updateLoadingProgress(40);
        updateLoadingMessage(`${baseMessage} - Crafting engaging copy`);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        updateLoadingProgress(65);
        updateLoadingMessage(`${baseMessage} - Optimizing for each platform`);
        
        const result = await apiCall();
        
        updateLoadingProgress(85);
        updateLoadingMessage(`${baseMessage} - Adding finishing touches`);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        updateLoadingProgress(100);
        
        return result;
      },
      baseMessage,
      {
        progress: 0,
        canCancel: options?.canCancel,
        onCancel: options?.onCancel,
        successMessage: 'Posts generated successfully!'
      }
    );
  }, [executeWithLoading, updateLoadingProgress, updateLoadingMessage]);

  /**
   * Wrapper for video thumbnail generation with progress
   */
  const executeVideoThumbnailGeneration = useCallback(async <T>(
    apiCall: () => Promise<T>,
    baseMessage: string = 'Generating video thumbnail...',
    options?: {
      canCancel?: boolean;
      onCancel?: () => void;
    }
  ): Promise<T | null> => {
    return executeWithLoading(
      async () => {
        updateLoadingProgress(20);
        updateLoadingMessage(`${baseMessage} - Analyzing video content`);
        
        await new Promise(resolve => setTimeout(resolve, 600));
        updateLoadingProgress(50);
        updateLoadingMessage(`${baseMessage} - Creating thumbnail design`);
        
        const result = await apiCall();
        
        updateLoadingProgress(80);
        updateLoadingMessage(`${baseMessage} - Optimizing for platforms`);
        
        await new Promise(resolve => setTimeout(resolve, 400));
        updateLoadingProgress(100);
        
        return result;
      },
      baseMessage,
      {
        progress: 0,
        canCancel: options?.canCancel,
        onCancel: options?.onCancel,
        successMessage: 'Video thumbnail generated!'
      }
    );
  }, [executeWithLoading, updateLoadingProgress, updateLoadingMessage]);

  /**
   * Wrapper for file upload operations with progress simulation
   */
  const executeFileUpload = useCallback(async <T>(
    uploadCall: () => Promise<T>,
    fileName: string = 'file',
    fileSize?: number,
    options?: {
      canCancel?: boolean;
      onCancel?: () => void;
    }
  ): Promise<T | null> => {
    const fileSizeText = fileSize ? ` (${(fileSize / 1024 / 1024).toFixed(1)}MB)` : '';
    const baseMessage = `Uploading ${fileName}${fileSizeText}`;
    
    return executeWithLoading(
      async () => {
        // Simulate upload progress phases
        updateLoadingProgress(5);
        updateLoadingMessage(`${baseMessage} - Preparing file`);
        
        await new Promise(resolve => setTimeout(resolve, 300));
        updateLoadingProgress(15);
        updateLoadingMessage(`${baseMessage} - Connecting to server`);
        
        await new Promise(resolve => setTimeout(resolve, 200));
        updateLoadingProgress(25);
        updateLoadingMessage(`${baseMessage} - Uploading data`);
        
        // Execute the actual upload
        const result = await uploadCall();
        
        updateLoadingProgress(85);
        updateLoadingMessage(`${baseMessage} - Processing on server`);
        
        await new Promise(resolve => setTimeout(resolve, 400));
        updateLoadingProgress(95);
        updateLoadingMessage(`${baseMessage} - Finalizing`);
        
        await new Promise(resolve => setTimeout(resolve, 200));
        updateLoadingProgress(100);
        
        return result;
      },
      baseMessage,
      {
        progress: 0,
        canCancel: options?.canCancel || true, // Allow cancellation by default
        onCancel: options?.onCancel,
        successMessage: `${fileName} uploaded successfully!`
      }
    );
  }, [executeWithLoading, updateLoadingProgress, updateLoadingMessage]);

  /**
   * Simple loading wrapper for quick operations
   */
  const executeQuickLoading = useCallback(async <T>(
    apiCall: () => Promise<T>,
    loadingMessage: string = 'Processing...'
  ): Promise<T | null> => {
    return executeWithLoading(apiCall, loadingMessage);
  }, [executeWithLoading]);

  return {
    executeWithLoading,
    executeImageGeneration,
    executePostGeneration,
    executeVideoThumbnailGeneration,
    executeFileUpload,
    executeQuickLoading,
    // Direct access to loading controls
    showLoading,
    hideLoading,
    updateLoadingMessage,
    updateLoadingProgress
  };
};
