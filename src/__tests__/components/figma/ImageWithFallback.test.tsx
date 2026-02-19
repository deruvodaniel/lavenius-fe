import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageWithFallback } from '../../../components/figma/ImageWithFallback';

describe('ImageWithFallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders an image with provided src', () => {
      render(
        <ImageWithFallback
          src="https://example.com/image.jpg"
          alt="Test image"
        />
      );

      const img = screen.getByRole('img', { name: 'Test image' });
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    it('renders with alt text', () => {
      render(
        <ImageWithFallback
          src="https://example.com/image.jpg"
          alt="Profile picture"
        />
      );

      expect(screen.getByAltText('Profile picture')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      render(
        <ImageWithFallback
          src="https://example.com/image.jpg"
          alt="Test"
          className="custom-class rounded-full"
        />
      );

      const img = screen.getByRole('img', { name: 'Test' });
      expect(img).toHaveClass('custom-class');
      expect(img).toHaveClass('rounded-full');
    });

    it('renders with custom style', () => {
      render(
        <ImageWithFallback
          src="https://example.com/image.jpg"
          alt="Test"
          style={{ width: '100px', height: '100px' }}
        />
      );

      const img = screen.getByRole('img', { name: 'Test' });
      expect(img).toHaveStyle({ width: '100px', height: '100px' });
    });

    it('passes additional HTML attributes to image', () => {
      render(
        <ImageWithFallback
          src="https://example.com/image.jpg"
          alt="Test"
          data-testid="my-image"
          loading="lazy"
        />
      );

      const img = screen.getByTestId('my-image');
      expect(img).toHaveAttribute('loading', 'lazy');
    });

    it('renders with width and height attributes', () => {
      render(
        <ImageWithFallback
          src="https://example.com/image.jpg"
          alt="Test"
          width={200}
          height={150}
        />
      );

      const img = screen.getByRole('img', { name: 'Test' });
      expect(img).toHaveAttribute('width', '200');
      expect(img).toHaveAttribute('height', '150');
    });
  });

  describe('Error Handling', () => {
    it('displays fallback when image fails to load', () => {
      render(
        <ImageWithFallback
          src="https://example.com/broken.jpg"
          alt="Broken image"
        />
      );

      const img = screen.getByRole('img', { name: 'Broken image' });
      
      // Trigger error event
      fireEvent.error(img);

      // Should now show fallback
      const fallbackImg = screen.getByRole('img', { name: 'Error loading image' });
      expect(fallbackImg).toBeInTheDocument();
    });

    it('fallback shows error placeholder SVG', () => {
      render(
        <ImageWithFallback
          src="https://example.com/broken.jpg"
          alt="Test"
        />
      );

      const img = screen.getByRole('img', { name: 'Test' });
      fireEvent.error(img);

      const fallbackImg = screen.getByRole('img', { name: 'Error loading image' });
      // Error SVG is base64 encoded
      expect(fallbackImg.getAttribute('src')).toContain('data:image/svg+xml;base64');
    });

    it('preserves original URL in data attribute on error', () => {
      const originalSrc = 'https://example.com/original.jpg';
      
      render(
        <ImageWithFallback
          src={originalSrc}
          alt="Test"
        />
      );

      const img = screen.getByRole('img', { name: 'Test' });
      fireEvent.error(img);

      const fallbackImg = screen.getByRole('img', { name: 'Error loading image' });
      expect(fallbackImg).toHaveAttribute('data-original-url', originalSrc);
    });

    it('wraps fallback in styled container', () => {
      const { container } = render(
        <ImageWithFallback
          src="https://example.com/broken.jpg"
          alt="Test"
          className="my-class"
        />
      );

      const img = screen.getByRole('img', { name: 'Test' });
      fireEvent.error(img);

      // Fallback container should have the className
      const fallbackContainer = container.querySelector('.my-class');
      expect(fallbackContainer).toBeInTheDocument();
      expect(fallbackContainer).toHaveClass('inline-block');
      expect(fallbackContainer).toHaveClass('bg-gray-100');
      expect(fallbackContainer).toHaveClass('text-center');
    });

    it('applies style to fallback container', () => {
      const { container } = render(
        <ImageWithFallback
          src="https://example.com/broken.jpg"
          alt="Test"
          style={{ width: '150px', height: '150px' }}
        />
      );

      const img = screen.getByRole('img', { name: 'Test' });
      fireEvent.error(img);

      const fallbackContainer = container.querySelector('.inline-block');
      expect(fallbackContainer).toHaveStyle({ width: '150px', height: '150px' });
    });

    it('centers fallback image in container', () => {
      const { container } = render(
        <ImageWithFallback
          src="https://example.com/broken.jpg"
          alt="Test"
        />
      );

      const img = screen.getByRole('img', { name: 'Test' });
      fireEvent.error(img);

      const innerContainer = container.querySelector('.flex.items-center.justify-center');
      expect(innerContainer).toBeInTheDocument();
    });

    it('passes additional props to fallback image', () => {
      render(
        <ImageWithFallback
          src="https://example.com/broken.jpg"
          alt="Test"
          data-testid="test-img"
        />
      );

      const img = screen.getByRole('img', { name: 'Test' });
      fireEvent.error(img);

      const fallbackImg = screen.getByRole('img', { name: 'Error loading image' });
      expect(fallbackImg).toHaveAttribute('data-testid', 'test-img');
    });
  });

  describe('State Transitions', () => {
    it('starts in non-error state', () => {
      render(
        <ImageWithFallback
          src="https://example.com/image.jpg"
          alt="Test"
        />
      );

      // Should not show fallback initially
      expect(screen.queryByRole('img', { name: 'Error loading image' })).not.toBeInTheDocument();
      expect(screen.getByRole('img', { name: 'Test' })).toBeInTheDocument();
    });

    it('transitions to error state on image error', () => {
      render(
        <ImageWithFallback
          src="https://example.com/image.jpg"
          alt="Test"
        />
      );

      const img = screen.getByRole('img', { name: 'Test' });
      
      // Before error
      expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
      
      // Trigger error
      fireEvent.error(img);
      
      // After error - fallback shown
      expect(screen.getByRole('img', { name: 'Error loading image' })).toBeInTheDocument();
    });

    it('remains in error state after error occurs', () => {
      const { rerender } = render(
        <ImageWithFallback
          src="https://example.com/image.jpg"
          alt="Test"
        />
      );

      const img = screen.getByRole('img', { name: 'Test' });
      fireEvent.error(img);

      // Rerender with same props
      rerender(
        <ImageWithFallback
          src="https://example.com/image.jpg"
          alt="Test"
        />
      );

      // Should still show fallback
      expect(screen.getByRole('img', { name: 'Error loading image' })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has accessible alt text on normal image', () => {
      render(
        <ImageWithFallback
          src="https://example.com/image.jpg"
          alt="A beautiful sunset over the ocean"
        />
      );

      expect(screen.getByAltText('A beautiful sunset over the ocean')).toBeInTheDocument();
    });

    it('has accessible alt text on fallback image', () => {
      render(
        <ImageWithFallback
          src="https://example.com/broken.jpg"
          alt="Profile"
        />
      );

      const img = screen.getByRole('img', { name: 'Profile' });
      fireEvent.error(img);

      expect(screen.getByAltText('Error loading image')).toBeInTheDocument();
    });

    it('image is in the document and visible', () => {
      render(
        <ImageWithFallback
          src="https://example.com/image.jpg"
          alt="Test"
        />
      );

      const img = screen.getByRole('img', { name: 'Test' });
      expect(img).toBeVisible();
    });

    it('fallback is visible after error', () => {
      render(
        <ImageWithFallback
          src="https://example.com/broken.jpg"
          alt="Test"
        />
      );

      const img = screen.getByRole('img', { name: 'Test' });
      fireEvent.error(img);

      const fallbackImg = screen.getByRole('img', { name: 'Error loading image' });
      expect(fallbackImg).toBeVisible();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty src', () => {
      render(
        <ImageWithFallback
          src=""
          alt="Empty source"
        />
      );

      const img = screen.getByRole('img', { name: 'Empty source' });
      expect(img).toHaveAttribute('src', '');
    });

    it('handles undefined src', () => {
      render(
        <ImageWithFallback
          src={undefined}
          alt="No source"
        />
      );

      const img = screen.getByRole('img', { name: 'No source' });
      expect(img).toBeInTheDocument();
    });

    it('handles empty alt text', () => {
      render(
        <ImageWithFallback
          src="https://example.com/image.jpg"
          alt=""
        />
      );

      // Empty alt makes it presentation role, query by tag
      const img = document.querySelector('img');
      expect(img).toHaveAttribute('alt', '');
    });

    it('handles empty className gracefully', () => {
      const { container } = render(
        <ImageWithFallback
          src="https://example.com/broken.jpg"
          alt="Test"
          className=""
        />
      );

      const img = screen.getByRole('img', { name: 'Test' });
      fireEvent.error(img);

      const fallbackContainer = container.querySelector('.inline-block');
      expect(fallbackContainer).toBeInTheDocument();
    });

    it('handles undefined className', () => {
      const { container } = render(
        <ImageWithFallback
          src="https://example.com/broken.jpg"
          alt="Test"
        />
      );

      const img = screen.getByRole('img', { name: 'Test' });
      fireEvent.error(img);

      const fallbackContainer = container.querySelector('.inline-block');
      expect(fallbackContainer).toBeInTheDocument();
    });

    it('handles special characters in src', () => {
      const specialSrc = 'https://example.com/image?param=value&other=123';
      
      render(
        <ImageWithFallback
          src={specialSrc}
          alt="Test"
        />
      );

      const img = screen.getByRole('img', { name: 'Test' });
      expect(img).toHaveAttribute('src', specialSrc);
    });

    it('handles data URL as src', () => {
      const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      
      render(
        <ImageWithFallback
          src={dataUrl}
          alt="Base64 image"
        />
      );

      const img = screen.getByRole('img', { name: 'Base64 image' });
      expect(img).toHaveAttribute('src', dataUrl);
    });

    it('handles relative src path', () => {
      render(
        <ImageWithFallback
          src="/images/photo.jpg"
          alt="Relative path"
        />
      );

      const img = screen.getByRole('img', { name: 'Relative path' });
      expect(img).toHaveAttribute('src', '/images/photo.jpg');
    });
  });

  describe('Multiple Instances', () => {
    it('each instance maintains independent error state', () => {
      render(
        <>
          <ImageWithFallback
            src="https://example.com/good.jpg"
            alt="Good image"
          />
          <ImageWithFallback
            src="https://example.com/bad.jpg"
            alt="Bad image"
          />
        </>
      );

      // Trigger error only on the second image
      const badImg = screen.getByRole('img', { name: 'Bad image' });
      fireEvent.error(badImg);

      // First image should still be normal
      expect(screen.getByRole('img', { name: 'Good image' })).toBeInTheDocument();
      // Second should show fallback
      expect(screen.getByRole('img', { name: 'Error loading image' })).toBeInTheDocument();
    });

    it('handles multiple images failing independently', () => {
      render(
        <>
          <ImageWithFallback
            src="https://example.com/bad1.jpg"
            alt="Bad image 1"
          />
          <ImageWithFallback
            src="https://example.com/bad2.jpg"
            alt="Bad image 2"
          />
        </>
      );

      // Trigger error on first
      const img1 = screen.getByRole('img', { name: 'Bad image 1' });
      fireEvent.error(img1);

      // Second should still be normal
      expect(screen.getByRole('img', { name: 'Bad image 2' })).toBeInTheDocument();

      // Trigger error on second
      const img2 = screen.getByRole('img', { name: 'Bad image 2' });
      fireEvent.error(img2);

      // Both should now show fallback
      const fallbackImages = screen.getAllByRole('img', { name: 'Error loading image' });
      expect(fallbackImages).toHaveLength(2);
    });
  });
});
