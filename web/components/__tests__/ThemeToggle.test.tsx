import { render, screen, fireEvent } from "@testing-library/react";
import ThemeToggle from "../ThemeToggle";

jest.mock("next-themes", () => ({
  useTheme: jest.fn(() => ({ theme: "light", setTheme: jest.fn() })),
}));

describe("ThemeToggle", () => {
  it("renders a button", () => {
    render(<ThemeToggle />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("calls setTheme with 'dark' when current theme is light", () => {
    const setTheme = jest.fn();
    const mockUseTheme = jest.requireMock("next-themes").useTheme as jest.Mock;
    mockUseTheme.mockReturnValue({ theme: "light", setTheme });
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button"));
    expect(setTheme).toHaveBeenCalledWith("dark");
  });
});
