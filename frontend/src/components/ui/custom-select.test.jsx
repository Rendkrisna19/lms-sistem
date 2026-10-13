import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { CustomSelect } from "./custom-select";

const options = [
  { value: "L", label: "Laki-laki" },
  { value: "P", label: "Perempuan" },
  { value: "X", label: "Lainnya" },
];

function Harness({ onChange = () => {} }) {
  const [value, setValue] = useState("");
  return (
    <CustomSelect
      id="gender"
      value={value}
      options={options}
      placeholder="Pilih"
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

describe("CustomSelect", () => {
  it("memilih dengan klik dan menampilkan label terpilih", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveTextContent("Pilih");
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("option", { name: /Perempuan/ }));
    expect(onChange).toHaveBeenCalledWith("P");
    expect(screen.getByRole("combobox")).toHaveTextContent("Perempuan");
  });

  it("bisa dipakai dengan keyboard: panah lalu Enter", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const trigger = screen.getByRole("combobox");
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    const list = screen.getByRole("listbox");
    fireEvent.keyDown(list, { key: "ArrowDown" });
    fireEvent.keyDown(list, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("P");
  });

  it("menutup daftar dengan Escape tanpa menutup dialog pembungkus", () => {
    const onDialogEscape = vi.fn();
    render(
      <div onKeyDown={(event) => event.key === "Escape" && onDialogEscape()}>
        <Harness />
      </div>
    );
    fireEvent.click(screen.getByRole("combobox"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onDialogEscape).not.toHaveBeenCalled();
  });

  it("mencari pilihan bila jumlahnya banyak", () => {
    const many = Array.from({ length: 10 }, (_, i) => ({ value: i, label: `Kelas ${i + 1}` }));
    render(<CustomSelect value="" options={many} onChange={() => {}} />);
    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.change(screen.getByLabelText("Cari pilihan"), { target: { value: "kelas 7" } });
    const listbox = screen.getByRole("listbox");
    expect(within(listbox).getAllByRole("option")).toHaveLength(1);
  });
});
