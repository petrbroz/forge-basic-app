self.addEventListener('push', ev => {
    const data = ev.data.json();
    self.registration.showNotification('Translation Complete', {
        body: `Model: ${data.name}, status: ${data.status}`,
        icon: '/logo.png'
    });
});
