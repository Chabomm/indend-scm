import type { GetServerSideProps, NextPage } from 'next';
import React, { useState, useEffect, useRef } from 'react';
import { api, setContext } from '@/libs/axios';
import { useRouter } from 'next/router';
import { cls, dateformatYYYYMMDDmmss, getToken } from '@/libs/utils';
import useForm from '@/components/form/useForm';
import Datepicker from 'react-tailwindcss-datepicker';
import Layout from '@/components/Layout';
import ListPagenation from '@/components/bbs/ListPagenation';

import {
    EditForm,
    EditFormTable,
    EditFormTH,
    EditFormTD,
    EditFormKeyword,
    EditFormDateRange,
    EditFormSubmitSearch,
    EditFormRadioList,
} from '@/components/UIcomponent/form/EditFormA';
import { ListTable, ListTableHead, ListTableBody, ListTableCaption, Callout } from '@/components/UIcomponent/table/ListTableA';

const GoodsList: NextPage = (props: any) => {
    const nav_id = 9;
    const crumbs = ['상품관리', '상품조회'];
    const title_sub = '상품조회 및 관리 합니다';
    const callout = [
        '<span class="font-bold">[상세보기]</span>를 클릭하시면, 해당 서비스 상품의 노출 화면을 확인하실 수 있습니다.',
        '<span class="text-red-500">서비스 상품 추가 등록, 수정, 판매 중지</span>를 원하시는 경우, 해당 서비스 상품의 담당 MD 메일(<span class="text-red-500">info@welfaredream.com</span>)로 문의 주시기 바랍니다.',
        '[처리상태 정의]',
        '전체 : 복지드림 고객사 어드민 기업혜택에 등록된 전체 서비스 상품',
        '판매중 : 현재 판매 노출중인 서비스 상품',
        '판매중지 : 판매자의 요청에 의해 현재 판매 노출이 되지 않는 서비스 상품',
    ];

    const router = useRouter();
    const [filter, setFilter] = useState<any>({});
    const [params, setParams] = useState<any>({});
    const [posts, setPosts] = useState<any>([]);

    useEffect(() => {
        setFilter(props.response.filter);
        setParams(props.response.params);
        s.setValues(props.response.params.filters);
        getPagePost(props.response.params);
    }, []);

    useEffect(() => {
        if ([...posts].length > 0) {
            const num2Curs: any = document.querySelectorAll('.num2Cur') || undefined;
            num2Curs.forEach(function (v) {
                v.innerText = v.innerText.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            });
        }
    }, [posts]);

    const getPagePost = async p => {
        let newPosts = await getPostsData(p);
        setPosts(newPosts.list);
    };

    const getPostsData = async p => {
        try {
            const { data } = await api.post(`/scm/b2b/center/goods/list`, p);
            setParams(data.params);
            return data;
        } catch (e: any) {}
    };

    const { s, fn } = useForm({
        onSubmit: async () => {
            await searching();
        },
    });

    const searching = async () => {
        params.filters = s.values;
        let newPosts = await getPostsData(params);
        setPosts(newPosts.list);
    };

    const openInboundGoods = async (guid: number) => {
        let b2b_center_domain = `http://localhost:13000`;
        if (`${process.env.NODE_ENV}` == 'production') {
            b2b_center_domain = `https://`;
        }

        var newForm = document.createElement('form');
        newForm.setAttribute('method', 'POST');

        var newInput = document.createElement('input');
        newInput.setAttribute('type', 'hidden');
        newInput.setAttribute('name', 'token');
        newInput.setAttribute('value', getToken(undefined));
        newForm.appendChild(newInput);

        var newInput = document.createElement('input');
        newInput.setAttribute('type', 'hidden');
        newInput.setAttribute('name', 'guid');
        newInput.setAttribute('value', guid + '');
        newForm.appendChild(newInput);

        document.body.appendChild(newForm);

        var objPopup = window.open('', 'b2b_goods_view', 'width=1120,height=800, scrollbars=no, toolbar=no, status=no, resizable=no'); //창띄우기 명령에서 그 경로는 빈칸으로 한다.
        newForm.target = 'b2b_goods_view'; // 타겟 : 위의 창띄우기의 창이름과 같아야 한다.
        newForm.action = b2b_center_domain + `/inbound/goods?guid=${guid}`; // 액션경로
        if (objPopup == null) alert('차단된 팝업창을 허용해 주세요'); // 팝업이 뜨는지 확인
        else {
            newForm.submit();
            objPopup.focus(); //새로 띄워준 창에 포커스를 맞춰준다.
        }
    };

    const download_excel = async () => {
        console.log('params', params);
        // try {
        //     const result = await api.get(`/scm/b2b/center/goods/xlsx`);
        //     console.log('result', result);
        // } catch (e: any) {}
        try {
            await api({
                url: `/scm/b2b/center/goods/xlsx`,
                method: 'POST',
                responseType: 'blob',
                data: { params },
            }).then(response => {
                console.log('response', response);
                var fileURL = window.URL.createObjectURL(new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
                var fileLink = document.createElement('a');
                fileLink.href = fileURL;
                // filename = util.getNow('%Y%m%d_%H%M%S_')  + "b2b_goods"
                fileLink.setAttribute('download', dateformatYYYYMMDDmmss() + '상품조회.xlsx');
                // fileLink.setAttribute('download', 'file');
                document.body.appendChild(fileLink);
                fileLink.click();
            });
        } catch (e: any) {}
    };

    return (
        <Layout nav_id={nav_id} crumbs={crumbs} title={crumbs[crumbs.length - 1]} user={props.user}>
            <Callout title={crumbs[crumbs.length - 1]} title_sub={title_sub} callout={callout} />

            <EditForm onSubmit={fn.handleSubmit}>
                <EditFormTable className="grid-cols-6">
                    <EditFormTH className="col-span-1">등록일</EditFormTH>
                    <EditFormTD className="col-span-2">
                        <EditFormDateRange input_name="create_at" values={s.values?.create_at} handleChange={fn.handleChangeDateRange} errors={s.errors} />
                    </EditFormTD>
                    <EditFormTH className="col-span-1">진열상태</EditFormTH>
                    <EditFormTD className="col-span-2">
                        <EditFormRadioList input_name="is_display" values={s.values?.is_display} filter_list={filter.is_display} handleChange={fn.handleChange} errors={s.errors} />
                    </EditFormTD>
                    <EditFormTH className="col-span-1">검색어</EditFormTH>
                    <EditFormTD className="col-span-5">
                        <EditFormKeyword
                            skeyword_values={s.values?.skeyword}
                            skeyword_type_values={s.values?.skeyword_type}
                            skeyword_type_filter={filter.skeyword_type}
                            handleChange={fn.handleChange}
                            errors={s.errors}
                        ></EditFormKeyword>
                    </EditFormTD>
                </EditFormTable>
                <EditFormSubmitSearch button_name="조회하기" submitting={s.submitting}></EditFormSubmitSearch>
            </EditForm>

            <ListTableCaption>
                <div className="">
                    검색 결과 : 총 {params?.page_total}개 중 {posts?.length}개
                </div>
                <div className="" onClick={() => download_excel()}>
                    <button className="text-sm text-green-600">
                        <i className="far fa-file-excel me-1"></i> 엑셀다운로드
                    </button>
                </div>
            </ListTableCaption>
            <ListTable>
                <ListTableHead>
                    <th>번호</th>
                    <th>상세보기</th>
                    <th>상태</th>
                    <th>서비스명</th>
                    <th>옵션</th>
                    <th>등록일</th>
                    <th>담당MD</th>
                </ListTableHead>
                <ListTableBody>
                    {posts?.map((v: any, i: number) => (
                        <tr key={`list-table-${i}`} className="">
                            <td className="text-center">{v.uid}</td>
                            <td className="text-center">
                                <button type="button" className="btn-filter" onClick={() => openInboundGoods(v.uid)}>
                                    상세보기
                                </button>
                            </td>
                            <td className="text-center">{v.is_display == 'T' ? '판매중' : '판매중지'}</td>
                            <td className="">{v.title}</td>
                            <td className="text-center">{v.option_value}</td>
                            <td className="text-center">{v.create_at}</td>
                            <td className="text-center">{v.indend_md_name}</td>
                        </tr>
                    ))}
                </ListTableBody>
            </ListTable>
            <ListPagenation props={params} getPagePost={getPagePost} />
        </Layout>
    );
};

export const getServerSideProps: GetServerSideProps = async ctx => {
    setContext(ctx);
    var request: any = {};
    var response: any = {};
    try {
        const { data } = await api.post(`/scm/b2b/center/goods/init`, request);
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

export default GoodsList;
