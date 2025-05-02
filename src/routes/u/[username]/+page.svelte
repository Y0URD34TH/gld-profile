<script lang="ts">
  import type { PageProps } from "./$types";
  import PocketBase from "pocketbase";
  import Games from "$lib/components/Games.svelte";
  import Followers from "$lib/components/Followers.svelte";
  import "$lib/styles/profile.scss";
  import { onDestroy, onMount } from "svelte";
  import { browser } from "$app/environment";
  import Avatar from "$lib/components/Avatar.svelte";

  let { data }: PageProps = $props();

  let online = $state(data.items[0].is_online);
  let currentGame = $state(data.items[0].currently_playing);
  let isFollowing = $state();
  const pb = new PocketBase(data.pbServer);

  onMount(() => {
    // Set up background styling
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundRepeat = "no-repeat";
    document.body.style.backgroundImage = `url(${data.background})`;
    document.body.style.height = "100vh";

    // Check if the current user is following the profile
    isFollowing = data.items[0].followers.includes(data.currentId);

    // Subscribe to live updates
    pb.collection("users").subscribe(data.items[0].id, (event) => {
      online = event.record.is_online;
      currentGame = event.record.currently_playing;

      const followerList = event.record.followers as string[];
      isFollowing = followerList.includes(data.currentId);
    });
  });

  onDestroy(() => {
    if (browser) {
      document.body.style.backgroundImage = "";
      document.body.style.height = "";
    }

    online = false;
    currentGame = "";

    pb.collection("users").unsubscribe(data.items[0].id);
  });

  async function followUser() {
    await fetch("/api/follow", {
      method: "POST",
      body: JSON.stringify({
        followId: data.items[0].id,
      }),
    });
  }

  async function unFollowUser() {
    await fetch("/api/un-follow", {
      method: "POST",
      body: JSON.stringify({
        followId: data.items[0].id,
      }),
    });
  }
</script>

<div class="profile">
  <div class="header">
    <div class="wrapper">
      <Avatar imgUrl={data.profilePicture} username={data.items[0].username} />

```
  <div class="name">
    {#if online}
      <h1>
        <span class="online">
          {data.items[0].displayName || data.items[0].username}
        </span>
        {#if currentGame.length > 0}
          <span class="current-game"> - {currentGame} </span>
        {/if}
      </h1>
    {:else}
      <h1>{data.items[0].displayName || data.items[0].username}</h1>
    {/if}
    <span>/u/{data.items[0].username}</span>
    <p>{data.items[0].description}</p>
  </div>
</div>

{#if data.items[0].id !== data.currentId}
  <div class="follow-btn">
    {#if isFollowing}
      <button on:click={unFollowUser}>Unfollow</button>
    {:else}
      <button on:click={followUser}>Follow</button>
    {/if}
  </div>
{/if}
```

  </div>

  <div class="content">
    <Games id={data.items[0].id} />
    <Followers user={data.items[0]} />
  </div>
</div>
