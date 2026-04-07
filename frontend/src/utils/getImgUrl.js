function getImgUrl(name) {
    if (!name || typeof name !== 'string') return '';

    // Some legacy DB records store full external image URLs.
    if (/^https?:\/\//i.test(name)) return name;
    if (/^data:image\//i.test(name)) return name;

    // Otherwise treat it as a local asset filename.
    return new URL(`../assets/books/${name}`, import.meta.url).href;
}

export {getImgUrl}