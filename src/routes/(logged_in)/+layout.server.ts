import { validate_JWT_login } from '$lib/security_util.server';
import type { JSONUser } from '$lib/db_utils.js';
import { getProfilePictureDetails } from '$lib/account_utils.server';
import type { ExistingProfilePicture } from '$lib/account_utils';

export function load({ url, cookies, setHeaders }) {
    const update = url.pathname;

    //Set cache-control headers to prevent caching of protected pages
    if (setHeaders) {
        setHeaders({
            'cache-control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'pragma': 'no-cache',
            'expires': '0'
        });
    }

    const user: JSONUser = validate_JWT_login(cookies, url.pathname + url.search);
    
    // const filepath = path.join(process.cwd(), 'uploads', 'profile_pictures', `user_${user.id}.png`);
    // const exists = fs.existsSync(filepath);
    // const last_modified = exists ? fs.statSync(filepath).mtimeMs : 0;
    // const profile_picture = { exists: exists, last_modified: last_modified };
    const profile_picture: ExistingProfilePicture = getProfilePictureDetails(user);
    

    return {
        user: user,
        profile_picture: profile_picture
    }
}