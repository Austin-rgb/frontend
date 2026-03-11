// Get user data from api
fetch("/api/auth/me/account")
  .then((res) =>
    res
      .json()
      .then((data) => {
        let user = data.data;
        if (user) {
          document.getElementById("user-name").textContent = user.name;
          document.getElementById("user-email").textContent = user.email;
          document.getElementById("user-id").textContent = user.user_id;
        } else {
          // If not authenticated, redirect to login page
          location.replace("/auth?next=/me");
        }
      })
      .catch((err) => {
        console.error("Failed to parse user data:", err);
        location.replace("/auth?next=/me");
      }),
  )
  .catch((err) => {
    console.log("failed to fetch data: ", err);
  });
