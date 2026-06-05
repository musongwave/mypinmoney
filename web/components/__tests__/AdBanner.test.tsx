import { render, screen } from "@testing-library/react";
import AdBanner from "../AdBanner";

describe("AdBanner", () => {
  it("renders a leaderboard container with correct dimensions", () => {
    render(<AdBanner size="leaderboard" adSlot="1234567890" />);
    const container = screen.getByTestId("ad-leaderboard");
    expect(container).toBeInTheDocument();
  });

  it("renders a rectangle container", () => {
    render(<AdBanner size="rectangle" adSlot="0987654321" />);
    const container = screen.getByTestId("ad-rectangle");
    expect(container).toBeInTheDocument();
  });
});
