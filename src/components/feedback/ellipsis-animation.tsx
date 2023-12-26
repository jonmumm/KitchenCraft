import "./ellipsis.css"; // Import the custom CSS for animation

export const EllipsisAnimation = () => {
  return (
    <div className="flex justify-center items-center">
      <span className="dot">.</span>
      <span className="dot">.</span>
      <span className="dot">.</span>
    </div>
  );
};
