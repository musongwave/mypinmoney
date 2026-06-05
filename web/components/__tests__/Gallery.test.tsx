import { render, screen, fireEvent } from "@testing-library/react";
import Gallery from "../Gallery";
import type { Pin } from "@/types";

function makePins(count: number): Pin[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `pin${i}`,
    source_url: `https://i.pinimg.com/mock${i}.jpg`,
    cloudinary_url: `https://res.cloudinary.com/demo/image/upload/mypinmoney/mock${i}.jpg`,
    created_at: new Date(2026, 5, i + 1).toISOString(),
  }));
}

describe("Gallery", () => {
  it("renders 24 cards on first page when given 30 pins", () => {
    render(<Gallery pins={makePins(30)} />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(24);
  });

  it("shows Next button when there are more than 24 pins", () => {
    render(<Gallery pins={makePins(30)} />);
    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
  });

  it("does not show Next button when all pins fit on one page", () => {
    render(<Gallery pins={makePins(10)} />);
    expect(screen.queryByRole("button", { name: /next/i })).not.toBeInTheDocument();
  });

  it("navigates to page 2 and shows remaining pins", () => {
    render(<Gallery pins={makePins(30)} />);
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(6); // 30 - 24
  });

  it("shows Prev button on page 2", () => {
    render(<Gallery pins={makePins(30)} />);
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByRole("button", { name: /prev/i })).toBeInTheDocument();
  });
});
