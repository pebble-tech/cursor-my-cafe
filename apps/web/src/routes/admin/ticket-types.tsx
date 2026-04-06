import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { type ColumnDef } from '@tanstack/react-table';
import { AlertCircle, Edit2, Loader2, Plus, Trash2 } from 'lucide-react';

import { EVENT_NAME_SHORT } from '@base/core/config/event';
import { Button } from '@base/ui/components/button';
import { DataTable } from '@base/ui/components/data-table';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@base/ui/components/dialog';
import { Input } from '@base/ui/components/input';

import {
  createTicketType,
  deleteTicketType,
  listTicketTypes,
  updateTicketType,
  type CreateTicketTypeInput,
  type UpdateTicketTypeInput,
} from '~/apis/admin/ticket-types';

export const Route = createFileRoute('/admin/ticket-types')({
  head: () => ({
    meta: [{ title: `Ticket types — Admin — ${EVENT_NAME_SHORT}` }],
  }),
  component: TicketTypesPage,
});

type TicketTypeRow = {
  id: string;
  code: string;
  name: string;
  lumaTicketTypeId: string;
  isActive: boolean;
  createdAt: Date;
};

function TicketTypesPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<TicketTypeRow | null>(null);

  const [form, setForm] = useState({
    code: '',
    name: '',
    lumaTicketTypeId: '',
    isActive: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['ticket-types'],
    queryFn: () => listTicketTypes(),
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateTicketTypeInput) => createTicketType({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-types'] });
      setCreateOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (input: UpdateTicketTypeInput) => updateTicketType({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-types'] });
      setEditOpen(false);
      setSelected(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTicketType({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-types'] });
      setDeleteOpen(false);
      setSelected(null);
    },
  });

  const resetForm = () => {
    setForm({ code: '', name: '', lumaTicketTypeId: '', isActive: true });
  };

  const openEdit = (row: TicketTypeRow) => {
    setSelected(row);
    setForm({
      code: row.code,
      name: row.name,
      lumaTicketTypeId: row.lumaTicketTypeId,
      isActive: row.isActive,
    });
    setEditOpen(true);
  };

  const columns: ColumnDef<TicketTypeRow>[] = [
    { accessorKey: 'code', header: 'Code' },
    { accessorKey: 'name', header: 'Name' },
    {
      accessorKey: 'lumaTicketTypeId',
      header: 'Luma ticket type ID',
      cell: ({ row }) => <span className="font-mono text-xs">{row.getValue('lumaTicketTypeId')}</span>,
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${row.original.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
        >
          {row.original.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEdit(row.original)} title="Edit">
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelected(row.original);
              setDeleteOpen(true);
            }}
            title="Delete"
            className="text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ticket types</h1>
          <p className="mt-1 text-sm text-gray-500">
            Define Luma ticket types before importing participants. Import matches on ticket name or Luma ticket type ID.
          </p>
        </div>
        <Dialog
          open={createOpen}
          onOpenChange={(o) => {
            setCreateOpen(o);
            if (!o) {
              resetForm();
              createMutation.reset();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add ticket type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create ticket type</DialogTitle>
              <DialogDescription>Codes are stable internal identifiers (e.g. session_a, drop_in).</DialogDescription>
            </DialogHeader>
            <TicketTypeFormFields form={form} setForm={setForm} error={createMutation.error as Error | null} />
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                onClick={() =>
                  createMutation.mutate({
                    code: form.code,
                    name: form.name,
                    lumaTicketTypeId: form.lumaTicketTypeId,
                    isActive: form.isActive,
                  })
                }
                disabled={!form.code || !form.name || !form.lumaTicketTypeId || createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Create'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <DataTable
          columns={columns}
          data={data?.ticketTypes ?? []}
          pageCount={1}
          pagination={{ pageIndex: 0, pageSize: 100 }}
          onPaginationChange={() => {}}
          isLoading={isLoading}
        />
      </div>

      <Dialog
        open={editOpen}
        onOpenChange={(o) => {
          setEditOpen(o);
          if (!o) {
            setSelected(null);
            resetForm();
            updateMutation.reset();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit ticket type</DialogTitle>
          </DialogHeader>
          {selected && (
            <>
              <TicketTypeFormFields form={form} setForm={setForm} error={updateMutation.error as Error | null} />
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button
                  onClick={() =>
                    updateMutation.mutate({
                      id: selected.id,
                      code: form.code,
                      name: form.name,
                      lumaTicketTypeId: form.lumaTicketTypeId,
                      isActive: form.isActive,
                    })
                  }
                  disabled={!form.code || !form.name || !form.lumaTicketTypeId || updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    'Save'
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onOpenChange={(o) => {
          setDeleteOpen(o);
          if (!o) {
            setSelected(null);
            deleteMutation.reset();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete ticket type</DialogTitle>
            <DialogDescription>
              Delete &quot;{selected?.name}&quot;? Participants must not reference this ticket type.
            </DialogDescription>
          </DialogHeader>
          {deleteMutation.isError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {(deleteMutation.error as Error).message}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => selected && deleteMutation.mutate(selected.id)}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TicketTypeFormFields({
  form,
  setForm,
  error,
}: {
  form: { code: string; name: string; lumaTicketTypeId: string; isActive: boolean };
  setForm: React.Dispatch<React.SetStateAction<typeof form>>;
  error: Error | null;
}) {
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Code *</label>
        <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Name * (match Luma CSV)</label>
        <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Luma ticket type ID *</label>
        <Input
          className="font-mono text-sm"
          value={form.lumaTicketTypeId}
          onChange={(e) => setForm((f) => ({ ...f, lumaTicketTypeId: e.target.value.trim() }))}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="tt-active"
          checked={form.isActive}
          onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
          className="h-4 w-4 rounded border-gray-300"
        />
        <label htmlFor="tt-active" className="text-sm font-medium">
          Active
        </label>
      </div>
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error.message}
        </div>
      )}
    </div>
  );
}
