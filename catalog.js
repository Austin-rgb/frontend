document.querySelectorAll(".add-to-cart").forEach((link) => {
  link.addEventListener("click", async (e) => {
    e.preventDefault();
    const url = this.href;
    await fetch(url);
    let items = await (await fetch("/api/cart/get")).json();
    let checkout_bar = document.querySelector("checkout-bar");
    let products = [];
    let total = 0;
    for (item of items) {
      let product = await (
        await fetch("/api/catalog/products/" + item.product)
      ).json();
      total += product.price;
      products.push(product);
    }
    let data = {
      cart: products,
      items: items.length,
      total,
    };
    checkout_bar.data = data;
  });
});

document.querySelectorAll(".start-order").forEach((link) => {
  link.addEventListener("click", function (e) {
    e.preventDefault();

    const url = this.href;
    let productId = url.split("/").pop(); // extract product ID from URL

    // Add product id to cart before starting order
    fetch("/api/cart/add?product=" + productId + "&qty=1").then(() => {
      location.href = "/app/checkout/";
    });
  });
});
