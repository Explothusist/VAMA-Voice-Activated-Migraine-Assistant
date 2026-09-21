import { Assignment, Class } from '$lib/db.server';
import type { JSONAssignment, JSONClass } from '$lib/db_utils';
import { type Actions, type RequestEvent } from '@sveltejs/kit';

export function load({ url, cookies, params }: RequestEvent) {
	const hack = url.pathname; // So it runs

	const assignment_data: JSONAssignment = Assignment.getById(Number(params.slug) ?? -1).toJSON();
	const class_data: JSONClass = Class.getById(assignment_data.class_id).toJSON();

	return {
		assignment_data: assignment_data,
		class_data: class_data
	};
}

export const actions: Actions = {
	
};
