export const SiteManifestLoader = {
    async load(siteId) {
        try {
            const response = await fetch(`./src/data/sites/${siteId}.json`);
            if (!response.ok) throw new Error(`Failed to load site manifest: ${siteId}`);
            return await response.json();
        } catch (err) {
            console.error("Manifest load error:", err);
            return null;
        }
    }
};
