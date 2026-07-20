type VisibilityData = {
	draft?: boolean;
	visibility?: 'public' | 'unlisted' | 'private';
};

export function isPublic(data: VisibilityData) {
	return !data.draft && (data.visibility ?? 'public') === 'public';
}

export function isRoutable(data: VisibilityData) {
	return !data.draft && (data.visibility ?? 'public') !== 'private';
}

export function isPrivate(data: VisibilityData) {
	return data.draft || (data.visibility ?? 'public') === 'private';
}
