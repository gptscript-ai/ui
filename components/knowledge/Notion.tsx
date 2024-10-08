import {
  Avatar,
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@nextui-org/react';
import React, { useContext, useEffect, useState } from 'react';
import { getNotionFiles, isNotionConfigured } from '@/actions/knowledge/notion';
import { CiSearch, CiShare1 } from 'react-icons/ci';
import { EditContext } from '@/contexts/edit';
import { importFiles } from '@/actions/knowledge/filehelper';
import { Link } from '@nextui-org/react';
import { syncFiles } from '@/actions/knowledge/tool';

interface NotionFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  notionConfigured: boolean;
  setNotionConfigured: React.Dispatch<React.SetStateAction<boolean>>;
  syncError: string;
}

export const NotionFileModal = ({
  isOpen,
  onClose,
  notionConfigured,
  setNotionConfigured,
  syncError,
}: NotionFileModalProps) => {
  const { droppedFiles, ensureImportedFiles } = useContext(EditContext);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [importing, setImporting] = useState(false);

  const [notionFiles, setNotionFiles] = useState<
    Map<string, { url: string; fileName: string }>
  >(new Map());

  const [selectedFile, setSelectedFile] = useState<string[]>(
    Array.from(droppedFiles.keys())
  );

  useEffect(() => {
    if (notionConfigured) return;

    const setConfigured = async () => {
      setNotionConfigured(await isNotionConfigured());
    };
    setConfigured();
  }, [notionConfigured, isOpen]);

  useEffect(() => {
    if (!notionConfigured) return;

    const setFiles = async () => {
      const notionFiles = await getNotionFiles();
      setNotionFiles(notionFiles);
    };

    setFiles();
  }, [isOpen, notionConfigured]);

  const onClickImport = async () => {
    setImporting(true);
    try {
      await syncFiles(selectedFile, 'notion');
      const files = await importFiles(selectedFile);
      ensureImportedFiles(files, 'notion');
    } finally {
      setImporting(false);
    }

    onClose();
  };

  const handleSelectedFileChange = (selected: any) => {
    if (selected === 'all') {
      setSelectedFile(Array.from(notionFiles.keys()));
    } else {
      setSelectedFile(Array.from(selected));
    }
  };

  return (
    <Modal
      size="4xl"
      isOpen={isOpen}
      onClose={onClose}
      hideCloseButton={true}
      scrollBehavior="inside"
      className="min-h-[40vh] max-h-[80vh]"
    >
      <ModalContent>
        <ModalHeader>
          <div className="w-full flex items-center justify-between">
            <div className="flex flex-row items-center">
              <Avatar
                size="sm"
                src="notion.svg"
                alt="Notion Icon"
                classNames={{ base: 'p-1.5 bg-white' }}
              />
              <p className="ml-2">Notion</p>
            </div>

            <div className="flex items-center justify-end p-2">
              {syncError && (
                <p className="text-sm text-red-500 ml-2">{syncError}</p>
              )}
            </div>
          </div>
        </ModalHeader>
        <ModalBody>
          <Input
            className="w-[20%] flex justify-end"
            placeholder="Search"
            size="sm"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
            startContent={<CiSearch />}
          />
          {notionConfigured && notionFiles.size > 0 && (
            <div className="flex flex-col gap-1">
              <Table
                selectionMode="multiple"
                selectionBehavior="toggle"
                aria-label="notion-files"
                isCompact={true}
                defaultSelectedKeys={selectedFile}
                onSelectionChange={(selected) => {
                  handleSelectedFileChange(selected);
                }}
              >
                <TableHeader>
                  <TableColumn>Name</TableColumn>
                  <TableColumn>Link</TableColumn>
                </TableHeader>
                <TableBody
                  items={Array.from(notionFiles.entries())
                    .sort((a, b) => {
                      if (a[1].fileName < b[1].fileName) {
                        return -1;
                      } else if (a[1].fileName > b[1].fileName) {
                        return 1;
                      } else {
                        return 0;
                      }
                    })
                    .filter(([_, file]) => {
                      if (!searchQuery) return true;
                      return file.fileName
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase());
                    })}
                >
                  {([key, value]) => (
                    <TableRow key={key}>
                      <TableCell>
                        <div className="flex flex-col">
                          <p>{value.fileName}</p>
                        </div>
                      </TableCell>
                      <TableCell className="w-[80px]">
                        <Button
                          isIconOnly
                          as={Link}
                          isExternal
                          href={value.url}
                          size="sm"
                          color="primary"
                          variant="flat"
                          startContent={<CiShare1 />}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            isLoading={importing}
            color="primary"
            size="sm"
            onClick={onClickImport}
          >
            Add to Knowledge
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
