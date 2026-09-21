import { Assignment } from '$lib/db.server';
import type { JSONAssignment } from '$lib/db_utils';
import { type Actions, type RequestEvent } from '@sveltejs/kit';

export function load({ url, cookies }: RequestEvent) {
	const hack = url.pathname; // So it runs
	
	const all_assignments: JSONAssignment[] = Assignment.getAll().map((a) => a.toJSON());

	return {
		all_assignments: all_assignments
	};
}

export const actions: Actions = {
	
};
