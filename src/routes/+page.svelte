<script lang="ts">
    import { enhance } from '$app/forms';
    import { writable } from 'svelte/store';
    import "$lib/styles/home.scss";

    // `data` is passed from the load function in +page.server.ts
    export let data;

    // Writable store to handle search results
    let responseData = writable<SearchData>();
</script>

<div class="search">
    {#if data.profile}  <!-- Only render the form if the profile exists -->
        <form
            action="/api/search"
            method="POST"
            use:enhance={() => {
                return async ({ result }) => {
                    // @ts-ignore
                    responseData.set(result.data as unknown as SearchData);
                };
            }}
        >
            <input type="text" name="query" placeholder="Search for a user" />
            <button type="submit">
                <img src="/search.svg" alt="search" />
            </button>
        </form>

        {#if $responseData !== undefined}
            {#each $responseData.data as item}
                <div class="search-profile">
                    <img src={ 
                        item.pictureUrl === "" ? 
                        `https://api.dicebear.com/9.x/identicon/svg?seed=${item.username}&backgroundColor=ffdfbf,b6e3f4` :
                        item.pictureUrl
                    } alt={`${item.username}'s profile picture`} />
                    <a href={`/u/${item.username}`} class="info">
                        <div class="names">
                            <span class="display">
                                {item.displayName}
                            </span>
                            <span class="username">
                                /u/{item.username}
                            </span>
                        </div>
                        <p class="description">
                            {item.description}
                        </p>
                    </a>
                </div>
            {/each}
        {/if}
    {/if}
</div>
