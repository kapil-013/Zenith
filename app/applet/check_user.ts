const fetchUser = async () => {
  const url = "https://firestore.googleapis.com/v1/projects/lunar-expanse-r7z9n/databases/ai-studio-a4e5dd9f-7c11-46ac-a8ac-4777cb65f044/documents/users";
  const res = await fetch(url);
  const data = await res.json();
  const user = data.documents.find((d: any) => {
    return d.fields.email?.stringValue === "jangrakapil9416@gmail.com";
  });
  if (user) {
    console.log("User ID:", user.name.split('/').pop());
    console.log("Role:", user.fields.role?.stringValue);
  } else {
    console.log("User not found");
  }
};

fetchUser().catch(console.error);
