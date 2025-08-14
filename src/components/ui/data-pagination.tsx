import { Button } from "@/components/ui/button";
interface Props {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}
export const DataPagination = ({ page, totalPages, onPageChange }: Props) => {
  return (
    <div className="flex justify-between items-center py-4">
      <Button disabled={page === 1} onClick={() => onPageChange(page - 1)}>
        Previous
      </Button>
      <span>
        Page {page} of {totalPages}
      </span>
      <Button
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </Button>
    </div>
  );
};
