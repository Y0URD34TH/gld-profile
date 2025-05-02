import { redirect } from '@sveltejs/kit'

export const load = async ({ locals }) => {
    // Check if the user is not logged in or the session is invalid
    if (locals.user === undefined || !locals.pb.authStore.isValid) {
        throw redirect(303, '/login');  // Redirect to login if not valid
    }

    // Return the user profile data to the page
    return {
        profile: locals.user
    };
};
