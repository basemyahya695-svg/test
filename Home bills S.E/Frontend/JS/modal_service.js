const ModalService = {
  open(contentHtml) {
    const modal = document.createElement("div");
    modal.className = "modal-backdrop open";
    modal.innerHTML = contentHtml;
    document.body.appendChild(modal);
    this.bindCloseActions(modal);
    return modal;
  },

  bindCloseActions(modal) {
    modal.querySelectorAll("[data-action='close-modal']").forEach((button) => {
      button.addEventListener("click", () => modal.remove());
    });
  },
};
