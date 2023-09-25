import { fetch } from 'undici';

/*
 * This function is used to expand a skyUrl to the final config API URL
 */
async function skyUrlExpander(
  skyUrl: string | undefined | null,
): Promise<string | undefined> {
  if (skyUrl && skyUrl.length > 0) {
    try {
      // Fetch the skyUrl, but don't automatically follow redirects
      const skyResponse = await fetch(skyUrl, { redirect: 'manual' });

      // If there is a potential redirect follow it
      if (skyResponse.status === 307) {
        return await skyUrlExpander(skyResponse.headers.get('Location'));
      } else if (skyResponse.status === 200) {
        // If there is no redirect, we have the final config API URL
        return skyUrl;
      }
    } catch (error) {
      console.error('Error while expaning short Sky URL', error);
    }
  }
}

export async function fetchSkyConfig(skyUrl: string | undefined | null) {
  const skyConfigUrl = await skyUrlExpander(skyUrl);
  if (skyConfigUrl) {
    const url = new URL(skyConfigUrl);
    const actorId = url.searchParams.get('actorId');
    if (actorId) {
      return {
        actorId,
        origin: url.origin,
      };
    }
  }
  console.error(
    `Error: URL does not point to a valid workflow, please contact support@stately.ai with the URL ${skyUrl}`,
  );
}
