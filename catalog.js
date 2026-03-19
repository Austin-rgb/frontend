document.querySelectorAll(".add-to-cart").forEach((link) => {
  link.addEventListener("click", function (e) {
    e.preventDefault();

    const url = this.href;

    fetch(url);
  });
});

document.querySelectorAll(".start-order").forEach((link) => {
  link.addEventListener("click", function (e) {
    e.preventDefault();

    const url = this.href;
    let productId = url.split("/").pop(); // extract product ID from URL

    // Add product id to cart before starting order
    fetch("/cart/add?product=" + productId + "&qty=1").then(() => {
      location.href = "/app/checkout/"; // navigate to checkout page after adding to cart
    });
  });
});
