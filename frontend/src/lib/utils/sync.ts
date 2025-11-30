import { supabase, isSupabaseConfigured } from '$lib/supabaseClient';
import { EssayStorage, type EssayData } from './storage';
import type { Session } from '@supabase/supabase-js';

export type SyncStatus = 'local-only' | 'syncing' | 'synced' | 'error';

export class SyncService {
	private static session: Session | null = null;

	static setSession(session: Session | null) {
		this.session = session;
	}

	static isConfigured(): boolean {
		return isSupabaseConfigured && supabase !== null;
	}

	// Sync a single essay to cloud
	static async syncEssayToCloud(essay: EssayData): Promise<boolean> {
		if (!this.isConfigured()) {
			console.log('Supabase not configured, skipping cloud sync');
			return false;
		}

		if (!this.session) {
			console.log('No session, skipping cloud sync');
			return false;
		}

		try {
			const { data, error } = await supabase
				.from('essays')
				.upsert({
					id: essay.id,
					user_id: this.session.user.id,
					title: essay.title,
					content: essay.content,
					word_count: essay.wordCount || 0,
					char_count: essay.charCount || 0,
					created_at: essay.created,
					updated_at: essay.modified
				}, {
					onConflict: 'id'
				});

			if (error) {
				console.error('Error syncing essay:', error);
				return false;
			}

			console.log('Essay synced to cloud:', essay.id);
			return true;
		} catch (e) {
			console.error('Sync error:', e);
			return false;
		}
	}

	// Sync all local essays to cloud
	static async syncAllToCloud(): Promise<{ success: number; failed: number }> {
		if (!this.isConfigured() || !this.session) {
			return { success: 0, failed: 0 };
		}

		const localEssays = EssayStorage.getAllEssays();
		let success = 0;
		let failed = 0;

		for (const essay of localEssays) {
			const result = await this.syncEssayToCloud(essay);
			if (result) {
				success++;
			} else {
				failed++;
			}
		}

		return { success, failed };
	}

	// Fetch essays from cloud and merge with local
	static async syncFromCloud(): Promise<void> {
		if (!this.isConfigured()) {
			console.log('Supabase not configured, skipping cloud fetch');
			return;
		}

		if (!this.session) {
			console.log('No session, skipping cloud fetch');
			return;
		}

		try {
			const { data: cloudEssays, error } = await supabase
				.from('essays')
				.select('*')
				.order('updated_at', { ascending: false });

			if (error) {
				console.error('Error fetching essays:', error);
				return;
			}

			if (!cloudEssays) return;

			// Merge cloud essays with local storage
			for (const cloudEssay of cloudEssays) {
				const localEssay = EssayStorage.getFromLocalStorage(cloudEssay.id);
				
				// If local essay doesn't exist or cloud is newer, save from cloud
				if (!localEssay || new Date(cloudEssay.updated_at) > new Date(localEssay.modified)) {
					const essayData: EssayData = {
						id: cloudEssay.id,
						title: cloudEssay.title,
						content: cloudEssay.content,
						created: cloudEssay.created_at,
						modified: cloudEssay.updated_at,
						wordCount: cloudEssay.word_count || 0,
						charCount: cloudEssay.char_count || 0
					};
					EssayStorage.saveToLocalStorage(essayData);
					console.log('Downloaded essay from cloud:', cloudEssay.id);
				}
			}
		} catch (e) {
			console.error('Error syncing from cloud:', e);
		}
	}

	// Save essay version to cloud
	static async saveVersionToCloud(essayId: string, content: string, wordCount?: number): Promise<boolean> {
		if (!this.isConfigured() || !this.session) {
			return false;
		}

		try {
			const { error } = await supabase
				.from('essay_versions')
				.insert({
					essay_id: essayId,
					content,
					word_count: wordCount || 0
				});

			if (error) {
				console.error('Error saving version:', error);
				return false;
			}

			return true;
		} catch (e) {
			console.error('Version save error:', e);
			return false;
		}
	}

	// Get cloud versions for an essay
	static async getCloudVersions(essayId: string): Promise<any[]> {
		if (!this.isConfigured() || !this.session) {
			return [];
		}

		try {
			const { data, error } = await supabase
				.from('essay_versions')
				.select('*')
				.eq('essay_id', essayId)
				.order('created_at', { ascending: false })
				.limit(10);

			if (error) {
				console.error('Error fetching versions:', error);
				return [];
			}

			return data || [];
		} catch (e) {
			console.error('Error fetching versions:', e);
			return [];
		}
	}

	// Delete essay from cloud
	static async deleteEssayFromCloud(essayId: string): Promise<boolean> {
		if (!this.isConfigured() || !this.session) {
			return false;
		}

		try {
			const { error } = await supabase
				.from('essays')
				.delete()
				.eq('id', essayId);

			if (error) {
				console.error('Error deleting essay from cloud:', error);
				return false;
			}

			return true;
		} catch (e) {
			console.error('Delete error:', e);
			return false;
		}
	}
}
