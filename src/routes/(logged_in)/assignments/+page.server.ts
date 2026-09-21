import { Assignment } from '$lib/db.server';
import type { JSONAssignment } from '$lib/db_utils';
import { type Actions, type RequestEvent } from '@sveltejs/kit';

export function load({ url, cookies }: RequestEvent) {
	const hack = url.pathname; // So it runs
	
	const all_assignments: JSONAssignment[] = Assignment.getAll().map((a) => a.toJSON());

    const help = (Number(url.searchParams.get("help") ?? "0") === 1);
    const filter_class = Number(url.searchParams.get("filter_class") ?? "-1");

	return {
		all_assignments: all_assignments,
		help: help,
		filter_class: filter_class
	};
}

export const actions: Actions = {
	
};
