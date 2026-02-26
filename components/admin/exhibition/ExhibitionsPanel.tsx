"use client"

import ExhibitionUploadModal from "@/components/admin/exhibition/ExhibitionUploadModal"
import ExhibitionCardByCategory from "@/components/admin/exhibition/ExhibitionCardByCategory"
import { useExhibitionsPanelData } from "@/components/admin/exhibition/hooks/useExhibitionsPanelData"

export default function ExhibitionsPanel() {
  const {
    isUploadOpen,
    setIsUploadOpen,
    isUploading,
    isLoadingPreviewItems,
    errorMessage,
    editingItem,
    resetSignal,
    selectedCategory,
    soloItems,
    groupItems,
    modalInitialValues,
    handleSave,
    handleDelete,
    handleEdit,
    openAddModal,
  } = useExhibitionsPanelData()

  return (
    <div className="space-y-6">
      <ExhibitionCardByCategory
        title="Solo exhibitions"
        category="solo-exhibitions"
        items={soloItems}
        isLoading={isLoadingPreviewItems}
        onAdd={openAddModal}
        onEdit={(item) => {
          void handleEdit(item)
        }}
        onDelete={(item) => handleDelete(item)}
      />
      <ExhibitionCardByCategory
        title="Group exhibitions"
        category="group-exhibitions"
        items={groupItems}
        isLoading={isLoadingPreviewItems}
        onAdd={openAddModal}
        onEdit={(item) => {
          void handleEdit(item)
        }}
        onDelete={(item) => handleDelete(item)}
      />
      <ExhibitionUploadModal
        key={`exhibition-modal-${resetSignal}`}
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        title={
          editingItem
            ? `Edit ${editingItem.category === "solo-exhibitions" ? "solo" : "group"} exhibition`
            : `Add ${selectedCategory === "solo-exhibitions" ? "solo" : "group"} exhibition`
        }
        description={`${editingItem?.category === "solo-exhibitions" ? "개인" : "그룹"}전 이미지 및 세부정보를 업로드 및 수정 할 수 있습니다`}
        onSave={handleSave}
        initialValues={modalInitialValues}
        isEditMode={Boolean(editingItem)}
        confirmLabel={editingItem ? "Save updates" : "Save exhibition"}
        isConfirmDisabled={isUploading}
        isSubmitting={isUploading}
        errorMessage={errorMessage}
      />
    </div>
  )
}
