import { Class } from '$lib/db.server';
import type { JSONClass } from '$lib/db_utils';
import { type Actions, type RequestEvent } from '@sveltejs/kit';

export function load({ url, cookies, params }: RequestEvent) {
	const hack = url.pathname; // So it runs

	const class_data: JSONClass = Class.getById(Number(params.slug) ?? -1).toJSON();

	return {
		class_data: class_data
	};
}

export const actions: Actions = {
	
};
