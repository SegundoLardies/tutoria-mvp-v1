import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

// Types for drawable objects
interface CircleObject {
  type: 'circle';
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
}

interface TextObject {
  type: 'text';
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize?: number;
  color?: string;
}

type DrawableObject = CircleObject | TextObject;

// Interface for imperative handle methods
export interface CanvasComponentRef {
  drawCircle: (args: { x: number, y: number, radius: number, color?: string }) => void;
  writeText: (args: { x: number, y: number, text: string, fontSize?: number, color?: string }) => void;
  clearCanvas: () => void;
}

// Props interface
interface CanvasComponentProps {
  width?: number;
  height?: number;
  backgroundColor?: string;
}

const CanvasComponent = forwardRef<CanvasComponentRef, CanvasComponentProps>(
  ({ width = 800, height = 600, backgroundColor = '#808080' }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const objectsRef = useRef<DrawableObject[]>([]);

    // Function to redraw all objects
    const redrawCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas with background color
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      // Draw all objects
      objectsRef.current.forEach((obj) => {
        if (obj.type === 'circle') {
          ctx.beginPath();
          ctx.arc(obj.x, obj.y, obj.radius, 0, 2 * Math.PI);
          ctx.fillStyle = obj.color;
          ctx.fill();
        } else if (obj.type === 'text') {
          ctx.fillStyle = obj.color || '#000000';
          ctx.font = `${obj.fontSize || 16}px Arial`;
          ctx.fillText(obj.text, obj.x, obj.y);
        }
      });
    };

    // Initialize canvas
    useEffect(() => {
      redrawCanvas();
    }, []);

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      drawCircle: (args: { x: number, y: number, radius: number, color?: string }) => {
        const newCircle: CircleObject = {
          type: 'circle',
          id: `circle_${Date.now()}_${Math.random()}`,
          x: args.x,
          y: args.y,
          radius: args.radius,
          color: args.color || '#ff0000',
        };
        objectsRef.current.push(newCircle);
        redrawCanvas();
      },

      writeText: (args: { x: number, y: number, text: string, fontSize?: number, color?: string }) => {
        const newText: TextObject = {
          type: 'text',
          id: `text_${Date.now()}_${Math.random()}`,
          x: args.x,
          y: args.y,
          text: args.text,
          fontSize: args.fontSize || 16,
          color: args.color || '#000000',
        };
        objectsRef.current.push(newText);
        redrawCanvas();
      },

      clearCanvas: () => {
        objectsRef.current = [];
        redrawCanvas();
      },
    }), []);

    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          border: '2px solid #ccc',
          borderRadius: '8px',
          backgroundColor,
        }}
      />
    );
  }
);

CanvasComponent.displayName = 'CanvasComponent';

export default CanvasComponent;