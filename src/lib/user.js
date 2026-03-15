/**
 * Generates a dynamic avatar URL based on the user's name.
 * Uses ui-avatars.com to generate initial-based avatars with random backgrounds.
 *
 * @param {string} name - The user's full name or name to use for initials.
 * @returns {string} The URL for the avatar image.
 */
export const getAvatarUrl = (name) => {
	// If name is missing (loading state), use a space for initials and a grey background
	const cleanName = name || " ";
	const background = name ? "random" : "eeeeee";

	// background=random gives a unique color for each name
	// color=fff ensures white text
	return `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=${background}&color=fff&size=256`;
};
