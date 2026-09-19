import { ActivityLog, ImportActivityLog } from "$lib/db.server";
import sanitize from "$lib/sanitize.server";
import { validate_JWT_login_admin } from "$lib/security_util.server";
import { getTimeMS, pretifyTableName } from "$lib/util";
import { json } from "@sveltejs/kit";
import fs from "fs";
import path from "path";


export const GET = async ({ url, cookies, params }) => {

    let user = validate_JWT_login_admin(cookies, url.pathname + url.search); // For authentication

    
    const vendor_contract_folder = path.join(process.cwd(), "uploads", "vendor_contract");
    const vendor_contract_path = path.join(vendor_contract_folder, `facility_${params.slug}_vendor_${params.vslug}.pdf`);
    const pdf = fs.readFileSync(vendor_contract_path);

    return new Response(pdf, {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": "inline",
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff"
        }
    });
};
