import React from "react";

export function SignOutButton() {
  // Check if the user is authenticated by looking for our token
  const isAuthenticated = !!localStorage.getItem("clinic_auth_token");

  const handleSignOut = () => {
    // 1. Remove the JWT token from the browser's storage
    localStorage.removeItem("clinic_auth_token");
    // 2. Reload the page to kick them back to the login screen
    window.location.reload();
  };

  // If they aren't logged in, don't show the sign-out button
  if (!isAuthenticated) {
    return null;
  }

  return (
    <button
      className="px-4 py-2 rounded bg-white text-gray-700 border border-gray-200 font-semibold hover:bg-gray-50 hover:text-red-600 transition-colors shadow-sm hover:shadow"
      onClick={handleSignOut}
    >
      Sign out
    </button>
  );
}