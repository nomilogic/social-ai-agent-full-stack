# Changelog

All notable changes to this project will be documented in this file.

## [Latest] - 2025-01-24

### Fixed
- **Aspect Ratio Image Generation**: Fixed critical issue where selected aspect ratios (e.g., 9:16, 16:9, 4:3) were being reset to 1:1 during image generation
  - Frontend correctly converts aspect ratios to specific width/height dimensions (e.g., 9:16 → 720x1280)
  - Backend now properly uses the width/height parameters sent by frontend instead of fallback logic
  - Simplified backend logic to directly use frontend-calculated dimensions
  - Fixed all image generation provider calls (Pollinations, Hugging Face, Gemini) to use correct dimensions
  - This resolves the issue where users would select 9:16 but get 1:1 square images instead

### Technical Details
- Simplified `routes/ai.ts` to trust frontend width/height calculations 
- Removed complex aspect ratio conversion logic from backend
- Updated all image generation provider calls to use `finalWidth`/`finalHeight`
- Fixed API response to return correct dimensions
