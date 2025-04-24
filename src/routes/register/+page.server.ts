import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import fs from 'fs/promises';
import path from 'path';

export const actions = {
	register: async ({ request, locals }) => {
		const formData = await request.formData();
		const data = Object.fromEntries([...formData]);

		if (!formData) {
			return fail(400, { missing: true });
		}

		if (data.password !== data.passwordConfirm) {
			return fail(400, {
				error: true,
				match: false
			});
		}

		try {
			const existingUser = await locals.pb
				.collection('users')
				.getFirstListItem(`username="${data.username}"`)
				.catch(() => null);

			if (existingUser) {
				return fail(400, {
					error: true,
					usernameTaken: true,
					message: 'Username is already taken.'
				});
			}

                       const randNum = Math.floor(Math.random() * 4);

                       const baseUrl = new URL(request.url).origin;
                       const imageUrl = `${baseUrl}/assets/${randNum}.jpg`;

                       const response = await fetch(imageUrl);
                       if (!response.ok) {
                       	console.error(`Failed to fetch image: ${response.statusText}`);
                       	throw new Error('Failed to fetch avatar image');
                       }

                       const imageBuf = await response.arrayBuffer();
                       const imageBlob = new Blob([imageBuf]);
                       const imageFile = new File([imageBlob], `${randNum}.jpg`, {
                       	type: 'image/jpeg'
                       });

			const reqData = {
				password: data.password,
				passwordConfirm: data.passwordConfirm,
				username: data.username,
				email: data.email,
				avatar: imageFile
			};

			await locals.pb
	            .collection('users')
	            .create(reqData)
	            .then(async (user) => {
		         await locals.pb.collection('games').create({
			            owner: user.id,
		              	games: null 
		          });
			locals.pb.authStore.clear(); 

         	});
	
		try {
			await locals.pb
				.collection('users')
				.authWithPassword(data.email.toString(), data.password.toString());
		} catch (err) {
			console.error('Login failed:', err);
			return fail(401, {
				error: true,
				message: 'Invalid login credentials.'
			});
		}
		} catch (err: any) {
			const errorData = err.response?.data;

			if (errorData?.username?.code === 'validation_not_unique') {
				return fail(400, {
					error: true,
					usernameTaken: true,
					message: 'That username is already in use.'
				});
			}

			return fail(400, {
				error: true,
				incorrect: true,
				message: errorData || 'An unexpected error occurred.'
			});
		}
	}
} satisfies Actions;

interface LoginForm {
	identity: string;
	password: string;
}
