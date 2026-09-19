import { get_logged_in_user } from "$lib/security_util.server";
import { startBackgroundTasks } from "$lib/db_utils.server";


export function load({ url, cookies }) {
    startBackgroundTasks();
    
    const user = get_logged_in_user(cookies);
    return {
        colormode: user.id !== -1 ? user.colormode : "Standard"
    };
}
