import { addProfilePictureAction, changeOwnColormodeUserAction, changeOwnPasswordUserAction, getProfilePictureDetails, removeProfilePictureAction } from "$lib/account_utils.server";
import { get_logged_in_user } from "$lib/security_util.server.js";
import { kPasswordRegexHTML } from "$lib/util";
import { fail } from "@sveltejs/kit";
import sanitize from "$lib/sanitize.server";
import path from 'path';
import fs from 'fs';


export function load( { cookies, url }) {
    const hack = url.pathname;
    /*  HACK: According to https://kit.svelte.dev/docs/load#rerunning-load-functions-when-do-load-functions-rerun
    load functions will not run when changing pages unless something referenced in the function, such as url, changes. Maybe could be replaced with invalidateAll()? 
    It must be url.pathname too, not just url.  */

    const user = get_logged_in_user(cookies);
    
    // const filepath = path.join(process.cwd(), 'uploads', 'profile_pictures', `user_${user.id}.png`);
    // const exists = fs.existsSync(filepath);
    // const last_modified = exists ? fs.statSync(filepath).mtimeMs : 0;
    // const profile_picture = { exists: exists, last_modified: last_modified };
    const profile_picture = getProfilePictureDetails(user);


    return {
        password_regex: kPasswordRegexHTML,
        profile_picture: profile_picture
    };
};

function send_refreshed_data(account_id: number) {
    const filepath = path.join(process.cwd(), 'uploads', 'profile_pictures', `user_${account_id}.png`);
    const exists = fs.existsSync(filepath);
    const last_modified = exists ? fs.statSync(filepath).mtimeMs : 0;
    const profile_picture = { exists: exists, last_modified: last_modified };

    return {
        password_regex: kPasswordRegexHTML,
        profile_picture: profile_picture
    };
};

export const actions = {

    changePassword: async ({ cookies, request, url }) => {
        
        const hack = url.pathname;
        // Parse submitted data data
        const data = await request.formData();

        let result = await changeOwnPasswordUserAction(cookies, data, url);

        if (result.success) {
            return { // Keeping Intellisense from throwing an error
                message: ""
            };
        }else {
            cookies.set("error-message", result.error_message, { path: "/"});
			return fail(result.code ?? 400, { message: result.error_message });
		}
    },

    changeColors: async ({ cookies, request, url }) => {
        const hack = url.pathname;
        const data = await request.formData();

        const result = await changeOwnColormodeUserAction(cookies, data, url);

        if (result.success) {
            return {
                
            };
        }else {
            cookies.set("error-message", result.error_message, { path: "/" });
            return fail(400, { message: result.error_message });
        }
    },

    addProfilePicture: async ({ cookies, request, url }) => {
        const hack = url.pathname;
        const data = await request.formData();
        
        const account_id = sanitize.toInt(data.get("account_id") as string);

        const result = await addProfilePictureAction(cookies, data, url);

        if (result.success) {
            return send_refreshed_data(account_id);
        }else {
            cookies.set("error-message", result.error_message, { path: "/" });
            return fail(400, { message: result.error_message });
        }
    },

    removeProfilePicture: async ({ cookies, request, url }) => {
        const hack = url.pathname;
        const data = await request.formData();
        
        const account_id = sanitize.toInt(data.get("account_id") as string);

        const result = await removeProfilePictureAction(cookies, data, url);

        if (result.success) {
            return send_refreshed_data(account_id);
        }else {
            cookies.set("error-message", result.error_message, { path: "/" });
            return fail(400, { message: result.error_message });
        }
    }

};
