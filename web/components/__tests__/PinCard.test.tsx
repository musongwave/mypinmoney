import { render, screen } from "@testing-library/react";
import PinCard from "../PinCard";
import type { Pin } from "@/types";

const mockPin: Pin = {
  id: "abc123",
  source_url: "https://i.pinimg.com/originals/mock.jpg",
  cloudinary_url: "https://res.cloudinary.com/demo/image/upload/mypinmoney/mock.jpg",
  created_at: "2026-06-05T03:00:00Z",
};

describe("PinCard", () => {
  it("renders a link to the pin detail page", () => {
    render(<PinCard pin={mockPin} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/pin/abc123");
  });

  it("renders an image with alt text", () => {
    render(<PinCard pin={mockPin} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("alt", "Wallpaper abc123");
  });
});
