export const prerender = false;

import { getBg, getPfp } from '$lib/utils';
import type { PageServerLoad, Actions } from './$types';
import { POCKETBASE_SERVER } from '$env/static/private';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
	// disables autoCancellation to avoid issues with 500 errors
	locals.pb.autoCancellation(false);

	const recordList = await locals.pb.collection('users').getList(1, 1, {
		filter: `username = "${params.username}"`
	});

	const user = recordList.items[0];

	// If user not found, return 404
	if (!user) {
		locals.pb.autoCancellation(true);
		throw fail(404, { message: 'User not found' });
	}

	const pfp = await getPfp(locals.pb, user.id, false);
	const bg = await getBg(locals.pb, user.id);

	// Re-enable autoCancellation
	locals.pb.autoCancellation(true);

	return {
		...recordList,
		profilePicture: pfp,
		background: bg,
		currentId: locals.user?.id || '',
		pbServer: POCKETBASE_SERVER
	};
};

export const actions: Actions = {
	follow: async ({ request, locals }) => {
		const formData = await request.formData();
		const currentFollowersStr = formData.get('current'); // stringified array
		const newFollower = formData.get('new');             // user ID to add
		const followTarget = formData.get('follow');         // target user ID

		if (!currentFollowersStr || !newFollower || !followTarget) {
			return fail(400, { message: 'Invalid form data' });
		}

		let currentFollowers: string[] = [];

		try {
			currentFollowers = JSON.parse(currentFollowersStr.toString());
		} catch (err) {
			console.error('Failed to parse current followers:', err);
			return fail(400, { message: 'Malformed followers list' });
		}

		// Avoid duplicates
		if (!currentFollowers.includes(newFollower.toString())) {
			currentFollowers.push(newFollower.toString());
		}

		try {
			await locals.pb.collection('users').update(followTarget.toString(), {
				followers: currentFollowers
			});
		} catch (err) {
			console.error('Failed to update followers:', err);
			return fail(500, { message: 'Could not update followers' });
		}

		return { success: true };
	}
};
