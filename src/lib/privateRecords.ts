import { getCollection, type CollectionEntry } from 'astro:content';
import { isPrivate } from './contentFilters';

export type PrivateKind = 'journal' | 'resources' | 'travel' | 'health' | 'projects' | 'devlogs';
export type PrivateEntry =
	| CollectionEntry<'journal'>
	| CollectionEntry<'resources'>
	| CollectionEntry<'travel'>
	| CollectionEntry<'health'>
	| CollectionEntry<'projects'>
	| CollectionEntry<'devlogs'>;

export type PrivateRecord = { kind: PrivateKind; entry: PrivateEntry };

export type PrivateListItem = {
	id: string;
	kind: PrivateKind;
	title: string;
	description: string;
	pubDate: Date;
	href: string;
};

export async function collectPrivateRecords(): Promise<PrivateRecord[]> {
	const collections: Array<[PrivateKind, Promise<PrivateEntry[]>]> = [
		['journal', getCollection('journal', ({ data }) => isPrivate(data)) as Promise<PrivateEntry[]>],
		['resources', getCollection('resources', ({ data }) => isPrivate(data)) as Promise<PrivateEntry[]>],
		['travel', getCollection('travel', ({ data }) => isPrivate(data)) as Promise<PrivateEntry[]>],
		['health', getCollection('health', ({ data }) => isPrivate(data)) as Promise<PrivateEntry[]>],
		['projects', getCollection('projects', ({ data }) => isPrivate(data)) as Promise<PrivateEntry[]>],
		['devlogs', getCollection('devlogs', ({ data }) => isPrivate(data)) as Promise<PrivateEntry[]>],
	];

	const records: PrivateRecord[] = [];
	for (const [kind, promise] of collections) {
		for (const entry of await promise) records.push({ kind, entry });
	}
	records.sort((a, b) => b.entry.data.pubDate.valueOf() - a.entry.data.pubDate.valueOf());
	return records;
}

export function toPrivateListItem(record: PrivateRecord): PrivateListItem {
	return {
		id: record.entry.id,
		kind: record.kind,
		title: record.entry.data.title,
		description: record.entry.data.description,
		pubDate: record.entry.data.pubDate,
		href: `/private/${record.kind}/${record.entry.id}/`,
	};
}
