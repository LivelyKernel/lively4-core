export function hashCode (aString) {
	let hash = 0;
	let i = 0;
	if (aString.length == 0) return hash;
	for (i = 0; i < aString.length; i++) {
		let char = aString.charCodeAt(i);
		hash = ((hash<<5)-hash)+char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash;
}

export function point (x, y) {
	return {
		x: x,
		y: y
	}
}