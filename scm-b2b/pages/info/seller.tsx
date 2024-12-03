import type { GetServerSideProps, NextPage } from 'next';
import React, { useState, useEffect, useRef } from 'react';
import { api, setContext } from '@/libs/axios';
import { useRouter } from 'next/router';
import { checkNumeric, cls, getToken } from '@/libs/utils';
import useForm from '@/components/form/useForm';
import Layout from '@/components/Layout';

import { EditForm, EditFormTable, EditFormTH, EditFormTD, EditFormSubmit, EditFormInput, EditFormLabel } from '@/components/UIcomponent/form/EditFormA';
import EditFormCallout from '@/components/UIcomponent/form/EditFormCallout';

const InfoSeller: NextPage = (props: any) => {
    const nav_id = 14;
    const crumbs = ['환경설정', '판매자정보'];
    const title_sub = '판매자 정보를 확인할 수 있습니다.';
    const callout = [];
    const router = useRouter();

    const [posts, setPosts] = useState<any>({});
    const [filter, setFilter] = useState<any>({});

    useEffect(() => {
        if (props) {
            if (props.response.code == 200) {
                setPosts(props.response);
                setFilter(props.response.filter);
            } else {
                alert(props.response.msg);
                // router.back();
            }
        }
    }, []);

    const { s, fn, attrs } = useForm({
        onSubmit: async () => {
            await editing('REG');
        },
    });

    const deleting = () => editing('DEL');

    const editing = async mode => {};

    const download_file = async (file_kind: string) => {
        let file_link = '';
        if (file_kind == 'biz_file') {
            file_link = posts?.biz_file;
        } else {
            file_link = posts?.biz_hooper;
        }

        const arr_file_link = file_link.split('/');
        const file_name = arr_file_link[arr_file_link.length - 1];

        try {
            await api({
                url: `/scm/aws/download`,
                method: 'POST',
                responseType: 'blob',
                data: {
                    file_url: file_link,
                },
            }).then(async response => {
                var fileURL = window.URL.createObjectURL(new Blob([response.data]));
                var fileLink = document.createElement('a');
                fileLink.href = fileURL;
                fileLink.setAttribute('download', file_name);
                document.body.appendChild(fileLink);
                fileLink.click();

                await api.post(`/be/aws/temp/delete`);
            });
        } catch (e: any) {
            console.log(e);
        }
    };

    return (
        <Layout nav_id={nav_id} crumbs={crumbs} title={crumbs[crumbs.length - 1]} user={props.user}>
            <EditFormCallout title={crumbs[crumbs.length - 1]} title_sub={title_sub} callout={callout} />
            <EditForm onSubmit={fn.handleSubmit}>
                <EditFormTable className="grid-cols-6">
                    <EditFormTH className="col-span-1">담당MD</EditFormTH>
                    <EditFormTD className="col-span-2">
                        <EditFormLabel className="">{posts?.indend_md_name}</EditFormLabel>
                    </EditFormTD>
                    <EditFormTH className="col-span-1">담당MD 내선번호</EditFormTH>
                    <EditFormTD className="col-span-2">
                        <EditFormLabel className="">
                            {posts?.indend_md_tel} / {posts?.indend_md_mobile}
                        </EditFormLabel>
                    </EditFormTD>
                    <EditFormTH className="col-span-1">판매자 아이디</EditFormTH>
                    <EditFormTD className="col-span-2">
                        <EditFormLabel className="">{posts?.seller_id}</EditFormLabel>
                    </EditFormTD>
                    <EditFormTH className="col-span-1">회사명</EditFormTH>
                    <EditFormTD className="col-span-2">
                        <EditFormLabel className="">{posts?.seller_name}</EditFormLabel>
                    </EditFormTD>
                    <EditFormTH className="col-span-1">대표자명</EditFormTH>
                    <EditFormTD className="col-span-2">
                        <EditFormLabel className="">{posts?.ceo_name}</EditFormLabel>
                    </EditFormTD>
                    <EditFormTH className="col-span-1">업태</EditFormTH>
                    <EditFormTD className="col-span-2">
                        <EditFormLabel className="">{posts?.biz_kind}</EditFormLabel>
                    </EditFormTD>
                    <EditFormTH className="col-span-1">종목</EditFormTH>
                    <EditFormTD className="col-span-2">
                        <EditFormLabel className="">{posts?.biz_item}</EditFormLabel>
                    </EditFormTD>
                    <EditFormTH className="col-span-1">사업자등록번호</EditFormTH>
                    <EditFormTD className="col-span-2">
                        <EditFormLabel className="">{posts?.biz_no}</EditFormLabel>
                    </EditFormTD>
                    <EditFormTH className="col-span-1">사업자등록증</EditFormTH>
                    <EditFormTD className="col-span-2">
                        {posts?.biz_file != null ? (
                            <div className="py-2 px-3">
                                첨부파일 :
                                <span
                                    className="text-blue-500 underline cursor-pointer text-start ms-2"
                                    onClick={e => {
                                        download_file('biz_file');
                                    }}
                                >
                                    파일다운로드 <i className="fas fa-file-download ms-1"></i>
                                </span>
                            </div>
                        ) : null}
                    </EditFormTD>
                    <EditFormTH className="col-span-1">정산주기</EditFormTH>
                    <EditFormTD className="col-span-2">
                        <EditFormLabel className="">
                            {posts?.account_cycle == 1
                                ? '일 정산'
                                : posts?.account_cycle == 7
                                ? '주 정산'
                                : posts?.account_cycle == 15
                                ? '15일 정산'
                                : posts?.account_cycle == 30 && '월 정산'}
                        </EditFormLabel>
                    </EditFormTD>

                    <EditFormTH className="col-span-1">정산 예금주</EditFormTH>
                    <EditFormTD className="col-span-2">
                        <EditFormLabel className="">{posts?.depositor}</EditFormLabel>
                    </EditFormTD>
                    <EditFormTH className="col-span-1">통장사본</EditFormTH>
                    <EditFormTD className="col-span-2">
                        {posts?.biz_hooper != null &&
                            (posts?.biz_file != null ? (
                                <div className="py-2 px-3">
                                    첨부파일 :
                                    <span
                                        className="text-blue-500 underline cursor-pointer text-start ms-2"
                                        onClick={e => {
                                            download_file('biz_file');
                                        }}
                                    >
                                        파일다운로드 <i className="fas fa-file-download ms-1"></i>
                                    </span>
                                </div>
                            ) : null)}
                    </EditFormTD>

                    <EditFormTH className="col-span-1">정산은행</EditFormTH>
                    <EditFormTD className="col-span-2">
                        <EditFormLabel className="">
                            ({posts?.bank}) {posts?.account}
                        </EditFormLabel>
                    </EditFormTD>

                    <EditFormTH className="col-span-1">세금계산서 메일주소</EditFormTH>
                    <EditFormTD className="col-span-2">
                        <EditFormLabel className="">{posts?.tax_email}</EditFormLabel>
                    </EditFormTD>
                    <EditFormTH className="col-span-1">발주 메일주소</EditFormTH>
                    <EditFormTD className="col-span-2">
                        <EditFormLabel className="">
                            {posts?.balju_staff_list?.length > 0 &&
                                posts?.balju_staff_list.map((v: any, i: number) => (
                                    <div>
                                        {v.name} : {v.email}
                                    </div>
                                ))}
                        </EditFormLabel>
                    </EditFormTD>
                    <EditFormTH className="col-span-1">사업장 소재지</EditFormTH>
                    <EditFormTD className="col-span-2">
                        <EditFormLabel className="">
                            ({posts?.post}) {posts?.addr} {posts?.addr_detail}
                        </EditFormLabel>
                    </EditFormTD>
                </EditFormTable>
            </EditForm>
        </Layout>
    );
};
export const getServerSideProps: GetServerSideProps = async ctx => {
    setContext(ctx);
    var request: any = {};
    var response: any = {};
    try {
        const { data } = await api.post(`/scm/b2b/center/info/seller/read`, request);
        response = data;
    } catch (e: any) {
        if (typeof e.redirect !== 'undefined') {
            return { redirect: e.redirect };
        }
    }
    return {
        props: { request, response },
    };
};

export default InfoSeller;
