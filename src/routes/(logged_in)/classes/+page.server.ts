import { Class } from '$lib/db.server';
import type { JSONClass } from '$lib/db_utils';
import { type Actions, type RequestEvent } from '@sveltejs/kit';

export function load({ url, cookies }: RequestEvent) {
	const hack = url.pathname; // So it runs

	const all_classes: JSONClass[] = Class.getAll().map((a) => a.toJSON());

	return {
		all_classes: all_classes
	};
}

export const actions: Actions = {
	
};
