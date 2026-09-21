import { Assignment, Class } from '$lib/db.server';
import type { JSONAssignment, JSONClass } from '$lib/db_utils';
import { type Actions, type RequestEvent } from '@sveltejs/kit';

export function load({ url, cookies, params }: RequestEvent) {
	const hack = url.pathname; // So it runs
	
    const email = (Number(url.searchParams.get("email") ?? "0") === 1);
    const print = (Number(url.searchParams.get("print") ?? "0") === 1);
    const scan = (Number(url.searchParams.get("scan") ?? "0") === 1);
    const help = (Number(url.searchParams.get("help") ?? "0") === 1);

	const assignment_data: JSONAssignment = Assignment.getById(Number(params.slug) ?? -1).toJSON();
	const class_data: JSONClass = Class.getById(assignment_data.class_id).toJSON();

	return {
		assignment_data: assignment_data,
		class_data: class_data,
		email: email,
		print: print,
		scan: scan,
		help: help
	};
}

export const actions: Actions = {
	
};
