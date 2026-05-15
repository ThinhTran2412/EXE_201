import type { ImageSourcePropType } from 'react-native';

export const LOCAL_PICTURES: ImageSourcePropType[] = [
  require('../../../picture/08ef9fc5cb35456b1c245.jpg'),
  require('../../../picture/0cf423426eb2e0ecb9a328.jpg'),
  require('../../../picture/173fd2fa860a0854511b16.jpg'),
  require('../../../picture/1de35fa31853960dcf4243.jpg'),
  require('../../../picture/208a3fac6b5ce502bc4d4.jpg'),
  require('../../../picture/22469bccd63c5862012d24.jpg'),
  require('../../../picture/2d5c71802570ab2ef26111.jpg'),
  require('../../../picture/36dbd1f185010b5f52108.jpg'),
  require('../../../picture/3fb13c9a686ae634bf7b6.jpg'),
  require('../../../picture/41219c2ac8da46841fcb3.jpg'),
  require('../../../picture/46ead19796671839417641.jpg'),
  require('../../../picture/47aac1208cd0028e5bc134.jpg'),
  require('../../../picture/481fdddb892b07755e3a21.jpg'),
  require('../../../picture/4add650031f0bfaee6e112.jpg'),
  require('../../../picture/58b0bb9aef6a6134387b9.jpg'),
  require('../../../picture/5dab352178d1f68fafc027.jpg'),
  require('../../../picture/74b924c76337ed69b42639.jpg'),
  require('../../../picture/757e58af0c5f8201db4e14.jpg'),
  require('../../../picture/8282dd4689b607e85ea723.jpg'),
  require('../../../picture/8887c00c8dfc03a25aed32.jpg'),
  require('../../../picture/8ca3508804788a26d3697.jpg'),
  require('../../../picture/8d5a7f9e2b6ea530fc7f22.jpg'),
  require('../../../picture/928cf20bbffb31a568ea35.jpg'),
  require('../../../picture/9cef5ee70a178449dd062.jpg'),
  require('../../../picture/9e471ace573ed960802f31.jpg'),
  require('../../../picture/a3eecd2b99db17854eca20.jpg'),
  require('../../../picture/a535cef09a00145e4d1118.jpg'),
  require('../../../picture/a6608cb3d843561d0f5215.jpg'),
  require('../../../picture/ac8e0f0642f6cca895e729.jpg'),
  require('../../../picture/ad33f8b9b5493b17625836.jpg'),
  require('../../../picture/aedee057ada723f97ab630.jpg'),
  require('../../../picture/bc1fc89585650b3b527426.jpg'),
  require('../../../picture/c10a06db522bdc75853a13.jpg'),
  require('../../../picture/c15b059e516edf30867f17.jpg'),
  require('../../../picture/cd188166c69648c8118742.jpg'),
  require('../../../picture/d590bc1af1ea7fb426fb33.jpg'),
  require('../../../picture/d868161651e6dfb886f740.jpg'),
  require('../../../picture/e504888ec57e4b20126f38.jpg'),
  require('../../../picture/e64e9293c663483d117210.jpg'),
  require('../../../picture/ebcda847e5b76be932a625.jpg'),
  require('../../../picture/ebe8812dd5dd5b8302cc19.jpg'),
  require('../../../picture/ee7c00775487dad983961.jpg'),
  require('../../../picture/ff497ac33733b96de02237.jpg'),
];

export function localPicture(index: number): ImageSourcePropType {
  const len = LOCAL_PICTURES.length;
  return LOCAL_PICTURES[((index % len) + len) % len];
}

export function localPictureSlice(start: number, count: number): ImageSourcePropType[] {
  return Array.from({ length: count }, (_, i) => localPicture(start + i));
}
