// Color Palette System for Modern Essay Writer

export interface ColorPalette {
	id: string;
	name: string;
	description: string;
	colors: {
		// Page backgrounds
		bgPrimary: string;
		bgSecondary: string;
		bgTertiary: string;
		
		// Text colors
		textPrimary: string;
		textSecondary: string;
		textTertiary: string;
		
		// Accent colors
		accent: string;
		accentHover: string;
		accentLight: string;
		
		// Border colors
		border: string;
		borderHover: string;
		
		// Status colors (keep consistent across themes)
		success: string;
		warning: string;
		error: string;
		info: string;
		
		// Editor specific
		editorBg: string;
		editorText: string;
		editorPlaceholder: string;
		
		// Scrollbar
		scrollbarThumb: string;
		scrollbarThumbHover: string;
	};
}

export const COLOR_PALETTES: ColorPalette[] = [
	{
		id: 'ocean-breeze',
		name: 'Ocean Breeze',
		description: 'Cool blues and whites for a calm writing experience',
		colors: {
			bgPrimary: '#f0f9ff',
			bgSecondary: '#ffffff',
			bgTertiary: '#e0f2fe',
			textPrimary: '#0c4a6e',
			textSecondary: '#075985',
			textTertiary: '#0284c7',
			accent: '#0ea5e9',
			accentHover: '#0284c7',
			accentLight: '#bae6fd',
			border: '#bae6fd',
			borderHover: '#7dd3fc',
			success: '#10b981',
			warning: '#f59e0b',
			error: '#ef4444',
			info: '#3b82f6',
			editorBg: '#ffffff',
			editorText: '#0c4a6e',
			editorPlaceholder: '#94a3b8',
			scrollbarThumb: 'rgba(14, 165, 233, 0.3)',
			scrollbarThumbHover: 'rgba(14, 165, 233, 0.5)',
		}
	},
	{
		id: 'forest-zen',
		name: 'Forest Zen',
		description: 'Earthy greens for focused, natural writing',
		colors: {
			bgPrimary: '#f0fdf4',
			bgSecondary: '#f9fafb',
			bgTertiary: '#dcfce7',
			textPrimary: '#14532d',
			textSecondary: '#166534',
			textTertiary: '#15803d',
			accent: '#22c55e',
			accentHover: '#16a34a',
			accentLight: '#bbf7d0',
			border: '#bbf7d0',
			borderHover: '#86efac',
			success: '#10b981',
			warning: '#f59e0b',
			error: '#ef4444',
			info: '#3b82f6',
			editorBg: '#fefefe',
			editorText: '#14532d',
			editorPlaceholder: '#94a3b8',
			scrollbarThumb: 'rgba(34, 197, 94, 0.3)',
			scrollbarThumbHover: 'rgba(34, 197, 94, 0.5)',
		}
	},
	{
		id: 'sunset-warmth',
		name: 'Sunset Warmth',
		description: 'Warm oranges and peaches for creative inspiration',
		colors: {
			bgPrimary: '#fff7ed',
			bgSecondary: '#fffbf5',
			bgTertiary: '#ffedd5',
			textPrimary: '#7c2d12',
			textSecondary: '#9a3412',
			textTertiary: '#c2410c',
			accent: '#f97316',
			accentHover: '#ea580c',
			accentLight: '#fed7aa',
			border: '#fed7aa',
			borderHover: '#fdba74',
			success: '#10b981',
			warning: '#f59e0b',
			error: '#ef4444',
			info: '#3b82f6',
			editorBg: '#fffef9',
			editorText: '#7c2d12',
			editorPlaceholder: '#94a3b8',
			scrollbarThumb: 'rgba(249, 115, 22, 0.3)',
			scrollbarThumbHover: 'rgba(249, 115, 22, 0.5)',
		}
	},
	{
		id: 'midnight-focus',
		name: 'Midnight Focus',
		description: 'Dark theme with purple accents for late-night writing',
		colors: {
			bgPrimary: '#0f172a',
			bgSecondary: '#1e293b',
			bgTertiary: '#334155',
			textPrimary: '#f1f5f9',
			textSecondary: '#e2e8f0',
			textTertiary: '#cbd5e1',
			accent: '#a78bfa',
			accentHover: '#8b5cf6',
			accentLight: '#ddd6fe',
			border: '#475569',
			borderHover: '#64748b',
			success: '#10b981',
			warning: '#f59e0b',
			error: '#ef4444',
			info: '#3b82f6',
			editorBg: '#1e293b',
			editorText: '#f1f5f9',
			editorPlaceholder: '#64748b',
			scrollbarThumb: 'rgba(167, 139, 250, 0.3)',
			scrollbarThumbHover: 'rgba(167, 139, 250, 0.5)',
		}
	},
	{
		id: 'monochrome-pro',
		name: 'Monochrome Professional',
		description: 'Clean grays for distraction-free writing',
		colors: {
			bgPrimary: '#fafafa',
			bgSecondary: '#f5f5f5',
			bgTertiary: '#e5e5e5',
			textPrimary: '#0f172a',
			textSecondary: '#334155',
			textTertiary: '#64748b',
			accent: '#475569',
			accentHover: '#334155',
			accentLight: '#cbd5e1',
			border: '#d4d4d4',
			borderHover: '#a3a3a3',
			success: '#10b981',
			warning: '#f59e0b',
			error: '#ef4444',
			info: '#3b82f6',
			editorBg: '#ffffff',
			editorText: '#0f172a',
			editorPlaceholder: '#94a3b8',
			scrollbarThumb: 'rgba(71, 85, 105, 0.3)',
			scrollbarThumbHover: 'rgba(71, 85, 105, 0.5)',
		}
	}
];

export function getColorPalette(id: string): ColorPalette | undefined {
	return COLOR_PALETTES.find(palette => palette.id === id);
}

export function applyColorPalette(palette: ColorPalette): void {
	const root = document.documentElement;
	
	// Apply CSS custom properties
	Object.entries(palette.colors).forEach(([key, value]) => {
		root.style.setProperty(`--color-${key}`, value);
	});
	
	// Store the current palette ID
	localStorage.setItem('essayforge-color-palette', palette.id);
}

export function getCurrentPalette(): ColorPalette {
	const savedId = localStorage.getItem('essayforge-color-palette');
	return getColorPalette(savedId || 'ocean-breeze') || COLOR_PALETTES[0];
}

export function initializeTheme(): void {
	const palette = getCurrentPalette();
	applyColorPalette(palette);
}
