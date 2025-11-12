// Storage utility for managing essays in localStorage with version history

export interface EssayData {
	id: string;
	title: string;
	content: string;
	created: string;
	modified: string;
	wordCount?: number;
	charCount?: number;
}

export interface EssayVersion {
	content: string;
	timestamp: string;
	wordCount?: number;
}

const MAX_VERSIONS = 10;

export class EssayStorage {
	// Get all essay IDs
	static getAllEssayIds(): string[] {
		const keys = Object.keys(localStorage);
		return keys
			.filter(key => key.startsWith('essay-') && !key.includes('-versions'))
			.map(key => key.replace('essay-', ''));
	}

	// Get essay by ID
	static getEssay(id: string): EssayData | null {
		try {
			const data = localStorage.getItem(`essay-${id}`);
			if (!data) return null;
			return JSON.parse(data);
		} catch (e) {
			console.error('Error loading essay:', e);
			return null;
		}
	}

	// Save essay with version history
	static saveEssay(essay: EssayData): void {
		try {
			// Save current version to version history
			const existingEssay = this.getEssay(essay.id);
			if (existingEssay && existingEssay.content !== essay.content) {
				this.addVersion(essay.id, existingEssay.content, existingEssay.wordCount);
			}

			// Save the essay
			localStorage.setItem(`essay-${essay.id}`, JSON.stringify(essay));
		} catch (e) {
			console.error('Error saving essay:', e);
		}
	}

	// Get version history for an essay
	static getVersions(essayId: string): EssayVersion[] {
		try {
			const data = localStorage.getItem(`essay-${essayId}-versions`);
			if (!data) return [];
			return JSON.parse(data);
		} catch (e) {
			console.error('Error loading versions:', e);
			return [];
		}
	}

	// Add a version to history (keeps last 10)
	private static addVersion(essayId: string, content: string, wordCount?: number): void {
		try {
			const versions = this.getVersions(essayId);
			
			// Add new version
			versions.push({
				content,
				timestamp: new Date().toISOString(),
				wordCount
			});

			// Keep only last MAX_VERSIONS
			const trimmedVersions = versions.slice(-MAX_VERSIONS);
			
			localStorage.setItem(`essay-${essayId}-versions`, JSON.stringify(trimmedVersions));
		} catch (e) {
			console.error('Error saving version:', e);
		}
	}

	// Restore a specific version
	static restoreVersion(essayId: string, versionIndex: number): EssayData | null {
		try {
			const versions = this.getVersions(essayId);
			const essay = this.getEssay(essayId);
			
			if (!essay || !versions[versionIndex]) return null;

			const version = versions[versionIndex];
			const restoredEssay: EssayData = {
				...essay,
				content: version.content,
				modified: new Date().toISOString(),
				wordCount: version.wordCount
			};

			this.saveEssay(restoredEssay);
			return restoredEssay;
		} catch (e) {
			console.error('Error restoring version:', e);
			return null;
		}
	}

	// Delete an essay and its versions
	static deleteEssay(id: string): void {
		localStorage.removeItem(`essay-${id}`);
		localStorage.removeItem(`essay-${id}-versions`);
	}

	// Get all essays with metadata
	static getAllEssays(): EssayData[] {
		const ids = this.getAllEssayIds();
		return ids
			.map(id => this.getEssay(id))
			.filter((essay): essay is EssayData => essay !== null)
			.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());
	}

	// Calculate storage usage
	static getStorageInfo(): { used: number; total: number; percentage: number } {
		let used = 0;
		for (const key in localStorage) {
			if (localStorage.hasOwnProperty(key)) {
				used += localStorage[key].length + key.length;
			}
		}
		
		// localStorage typically has 5-10MB limit, we'll use 5MB as conservative estimate
		const total = 5 * 1024 * 1024; // 5MB in bytes
		
		return {
			used,
			total,
			percentage: (used / total) * 100
		};
	}
}
