import { cn } from '../utils';

describe('cn (classname utility)', () => {
  it('should merge class names correctly', () => {
    const result = cn('text-red-500', 'bg-blue-500');
    expect(result).toBe('text-red-500 bg-blue-500');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).toBe('base-class active-class');
  });

  it('should remove false values', () => {
    const isActive = false;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).toBe('base-class');
  });

  it('should merge tailwind classes correctly (deduplication)', () => {
    // twMerge should handle conflicting classes
    const result = cn('px-2 py-1', 'px-4');
    expect(result).toBe('py-1 px-4');
  });

  it('should handle arrays of classes', () => {
    const result = cn(['text-sm', 'font-bold'], 'text-red-500');
    expect(result).toBe('text-sm font-bold text-red-500');
  });

  it('should handle objects with conditional classes', () => {
    const result = cn({
      'text-red-500': true,
      'bg-blue-500': false,
    });
    expect(result).toBe('text-red-500');
  });

  it('should handle empty input', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('should handle null and undefined', () => {
    const result = cn('text-red-500', null, undefined, 'bg-blue-500');
    expect(result).toBe('text-red-500 bg-blue-500');
  });
});
