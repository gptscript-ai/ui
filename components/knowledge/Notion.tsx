import {
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
import { IoMdRefresh } from 'react-icons/io';
import { Image } from '@nextui-org/image';
import {
  getNotionFiles,
  isNotionConfigured,
  runNotionSync,
} from '@/actions/knowledge/notion';
import { CiSearch, CiShare1 } from 'react-icons/ci';
import { EditContext } from '@/contexts/edit';
import { importFiles } from '@/actions/knowledge/filehelper';

interface NotionFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSyncing: boolean;
  setIsSyncing: React.Dispatch<React.SetStateAction<boolean>>;
  notionConfigured: boolean;
  setNotionConfigured: React.Dispatch<React.SetStateAction<boolean>>;
  syncError: string;
  setSyncError: React.Dispatch<React.SetStateAction<string>>;
}

export const NotionFileModal = ({
  isOpen,
  onClose,
  notionConfigured,
  setNotionConfigured,
  isSyncing,
  setIsSyncing,
  syncError,
  setSyncError,
}: NotionFileModalProps) => {
  const { droppedFiles, setDroppedFiles } = useContext(EditContext);
  const [searchQuery, setSearchQuery] = useState<string>('');

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
    const files = await importFiles(selectedFile, 'notion');
    setDroppedFiles((prev) => {
      const newMap = new Map(prev);
      for (const [key, file] of Array.from(newMap.entries())) {
        if (file.type === 'notion') {
          newMap.delete(key);
        }
      }
      for (const [key, file] of Array.from(files.entries())) {
        newMap.set(key, file);
      }
      return newMap;
    });
    onClose();
  };

  const syncNotion = async () => {
    setIsSyncing(true);
    try {
      const isConfigured = await isNotionConfigured();
      await runNotionSync(isConfigured);
      setNotionConfigured(isConfigured);
      setNotionFiles(await getNotionFiles());
      setSyncError('');
    } catch (e) {
      setSyncError((e as Error).toString());
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSelectedFileChange = (selected: any) => {
    if (selected === 'all') {
      setSelectedFile(Array.from(notionFiles.keys()));
    } else {
      setSelectedFile(Array.from(selected as Set<string>));
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
              <Image className="h-6 w-6" src="notion.svg" alt="Notion Icon" />
              <p className="ml-2">Notion</p>
            </div>

            <div className="flex items-center justify-end p-2">
              <Button
                isLoading={isSyncing}
                size="sm"
                color="primary"
                startContent={!isSyncing && <IoMdRefresh />}
                onClick={syncNotion}
              >
                {!isSyncing && 'Sync'}
              </Button>
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
          {notionConfigured && notionFiles.size > 0 ? (
            <div className="flex flex-col gap-1">
              <Table
                selectionMode="multiple"
                selectionBehavior="toggle"
                aria-label="notion-files"
                isCompact={true}
                selectedKeys={selectedFile}
                onSelectionChange={(selected) => {
                  handleSelectedFileChange(selected);
                }}
              >
                <TableHeader>
                  <TableColumn>NAME</TableColumn>
                  <TableColumn>Link</TableColumn>
                </TableHeader>
                <TableBody>
                  {Array.from(notionFiles.entries())
                    .filter(([_, file]) => {
                      if (!searchQuery) return true;
                      return file.fileName
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase());
                    })
                    .map(([key, value]) => (
                      <TableRow key={key}>
                        <TableCell>
                          <div className="flex flex-col">
                            <p>{value.fileName}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            isIconOnly
                            size="sm"
                            color="primary"
                            variant="flat"
                            startContent={<CiShare1 />}
                            onClick={() => {
                              window.open(value.url);
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-zinc-500">
                {`Click the "Sync" button to sync your Notion files`}
              </p>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="primary" size="sm" onClick={onClickImport}>
            Import
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
